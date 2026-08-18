import { createHmac } from 'node:crypto'

import { packPorId, type IdPack } from '@/lib/creditos'

/** 2 = pagada. Flow no acredita con 1 (pendiente), 3 (rechazada) ni 4 (anulada). */
export const FLOW_STATUS_PAGADA = 2

export const FLOW_API_URL_PRODUCCION = 'https://www.flow.cl/api'
export const FLOW_API_URL_SANDBOX = 'https://sandbox.flow.cl/api'

export function flowConfigurado(): boolean {
  return Boolean(process.env.FLOW_API_KEY?.trim() && process.env.FLOW_SECRET_KEY?.trim())
}

export function urlApiFlow(): string {
  const explicita = process.env.FLOW_API_URL?.trim()
  if (explicita) return explicita.replace(/\/+$/, '')
  const sandbox = process.env.FLOW_SANDBOX?.trim().toLowerCase()
  if (sandbox === '1' || sandbox === 'true') return FLOW_API_URL_SANDBOX
  return FLOW_API_URL_PRODUCCION
}

/**
 * Receta oficial Flow (no inventar):
 * https://developers.flow.cl/docs/tutorial-basics/create-order
 * https://developers.flow.cl/docs/tutorial-basics/order-confirmation
 * https://developers.flow.cl/docs/tutorial-basics/status
 *
 * Firma: keys sort + concat key+value, HMAC-SHA256 hex con FLOW_SECRET_KEY.
 * El campo `s` no se firma.
 */
export function firmarParamsFlow(
  params: Record<string, string | number>,
  secretKey: string,
): string {
  const firmables = Object.entries(params).filter(([clave]) => clave !== 's')
  firmables.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const toSign = firmables.map(([clave, valor]) => `${clave}${valor}`).join('')
  return createHmac('sha256', secretKey).update(toSign).digest('hex')
}

/** Params oficiales de `POST /payment/create` (application/x-www-form-urlencoded). */
export function paramsCreatePagoFlow(args: {
  apiKey: string
  commerceOrder: string
  amount: number
  email: string
  subject: string
  urlReturn: string
  urlConfirmation: string
}): Record<string, string | number> {
  return {
    apiKey: args.apiKey,
    commerceOrder: args.commerceOrder,
    amount: args.amount,
    email: args.email,
    subject: args.subject,
    urlReturn: args.urlReturn,
    urlConfirmation: args.urlConfirmation,
  }
}

/** Receta oficial: url + "?token=" + token */
export function urlCheckoutFlow(url: string, token: string): string {
  return `${url}?token=${token}`
}

/** urlConfirmation: 200 si llegó el token (Flow exige <15s). */
export function statusHttpConfirmacionFlow(hayToken: boolean): 200 | 400 {
  return hayToken ? 200 : 400
}

export function paramsConFirma(
  params: Record<string, string | number>,
  secretKey: string,
): Record<string, string> {
  const comoTexto: Record<string, string> = {}
  for (const [clave, valor] of Object.entries(params)) {
    comoTexto[clave] = String(valor)
  }
  comoTexto.s = firmarParamsFlow(comoTexto, secretKey)
  return comoTexto
}

export function comercioOrderPack(proveedorId: string, packId: IdPack, nonce: string): string {
  return `pack:${proveedorId}:${packId}:${nonce}`
}

export function leerComercioOrderPack(
  commerceOrder: string | null | undefined,
): { proveedorId: string; packId: IdPack } | null {
  if (!commerceOrder) return null
  const partes = commerceOrder.split(':')
  if (partes[0] !== 'pack' || partes.length < 4 || !partes[1] || !partes[2]) return null
  const pack = packPorId(partes[2])
  if (!pack) return null
  return { proveedorId: partes[1], packId: pack.id }
}

/** idempotencyKey oficial: commerceOrder, o flowOrder si falta. */
export function clavePagoFlow(args: { commerceOrder?: string | null; flowOrder?: string | number | null }): string {
  const commerce = args.commerceOrder?.trim()
  if (commerce) return commerce
  const flowOrder = args.flowOrder
  if (flowOrder !== undefined && flowOrder !== null && String(flowOrder).trim() !== '') {
    return String(flowOrder)
  }
  throw new Error('Falta commerceOrder o flowOrder para el asiento.')
}

export function pagoFlowPagado(status: number): boolean {
  return status === FLOW_STATUS_PAGADA
}

export type DecisionAcreditarFlow =
  | {
      ok: true
      proveedorId: string
      packId: IdPack
      montoClp: number
      idempotencyKey: string
    }
  | { ok: false; motivo: 'pendiente' | 'rechazado' | 'orden' | 'monto' }

/**
 * Nunca acreditar si Flow no confirma status 2, o si el monto / orden no calzan.
 */
export function decisionAcreditarFlow(pago: {
  status: number
  amount: number
  commerceOrder: string
  flowOrder?: number | string | null
}): DecisionAcreditarFlow {
  if (pago.status !== FLOW_STATUS_PAGADA) {
    return { ok: false, motivo: pago.status === 1 ? 'pendiente' : 'rechazado' }
  }
  const parsed = leerComercioOrderPack(pago.commerceOrder)
  if (!parsed) return { ok: false, motivo: 'orden' }
  const pack = packPorId(parsed.packId)
  if (!pack || pack.montoClp !== pago.amount) return { ok: false, motivo: 'monto' }
  return {
    ok: true,
    proveedorId: parsed.proveedorId,
    packId: parsed.packId,
    montoClp: pack.montoClp,
    idempotencyKey: clavePagoFlow({
      commerceOrder: pago.commerceOrder,
      flowOrder: pago.flowOrder,
    }),
  }
}
