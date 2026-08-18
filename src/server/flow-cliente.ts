import 'server-only'

import {
  flowConfigurado,
  paramsConFirma,
  paramsCreatePagoFlow,
  urlApiFlow,
  urlCheckoutFlow,
} from '@/lib/flow'

export type EstadoFlowPago = {
  flowOrder: number
  commerceOrder: string
  status: number
  amount: number
  currency: string
}

function credenciales(): { apiKey: string; secretKey: string } | null {
  const apiKey = process.env.FLOW_API_KEY?.trim()
  const secretKey = process.env.FLOW_SECRET_KEY?.trim()
  if (!apiKey || !secretKey) return null
  return { apiKey, secretKey }
}

async function leerJson(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text()
  try {
    return JSON.parse(texto) as unknown
  } catch {
    throw new Error('Flow respondió un cuerpo que no es JSON.')
  }
}

export async function crearPagoFlow(args: {
  commerceOrder: string
  subject: string
  amount: number
  email: string
  urlConfirmation: string
  urlReturn: string
}): Promise<{ url: string; token: string; flowOrder: number }> {
  const creds = credenciales()
  if (!creds || !flowConfigurado()) {
    throw new Error('Flow no está configurado.')
  }

  const body = paramsConFirma(
    paramsCreatePagoFlow({
      apiKey: creds.apiKey,
      commerceOrder: args.commerceOrder,
      amount: args.amount,
      email: args.email,
      subject: args.subject,
      urlReturn: args.urlReturn,
      urlConfirmation: args.urlConfirmation,
    }),
    creds.secretKey,
  )

  const respuesta = await fetch(`${urlApiFlow()}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })

  const data = (await leerJson(respuesta)) as {
    url?: string
    token?: string
    flowOrder?: number
    message?: string
    code?: number
  }

  if (!respuesta.ok || !data.url || !data.token) {
    throw new Error(data.message ?? 'Flow no pudo crear el pago.')
  }

  return {
    url: urlCheckoutFlow(data.url, data.token),
    token: data.token,
    flowOrder: data.flowOrder ?? 0,
  }
}

export async function estadoPagoFlow(token: string): Promise<EstadoFlowPago> {
  const creds = credenciales()
  if (!creds) throw new Error('Flow no está configurado.')

  const query = paramsConFirma({ apiKey: creds.apiKey, token }, creds.secretKey)
  const url = new URL(`${urlApiFlow()}/payment/getStatus`)
  for (const [clave, valor] of Object.entries(query)) {
    url.searchParams.set(clave, valor)
  }

  const respuesta = await fetch(url, { method: 'GET' })
  const data = (await leerJson(respuesta)) as {
    flowOrder?: number
    commerceOrder?: string
    status?: number
    amount?: number
    currency?: string
    message?: string
  }

  if (!respuesta.ok || data.flowOrder === undefined || !data.commerceOrder || data.status === undefined) {
    throw new Error(data.message ?? 'Flow no entregó el estado del pago.')
  }

  return {
    flowOrder: data.flowOrder,
    commerceOrder: data.commerceOrder,
    status: data.status,
    amount: Math.round(Number(data.amount ?? 0)),
    currency: data.currency ?? 'CLP',
  }
}
