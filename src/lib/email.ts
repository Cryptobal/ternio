import { Resend } from 'resend'

import { formatearClp } from '@/lib/dinero'
import { proveedorCubreLead, type LeadMatch, type ProveedorMatch } from '@/lib/matching'
import { esCorreoValido } from '@/lib/validar-identidad'

export const REMITENTE_RESEND_DEFAULT = 'Ternio <avisos@ternio.cl>'
export const URL_PANEL_PROVEEDOR = 'https://www.ternio.cl/panel'
export const URL_MIS_COTIZACIONES = 'https://www.ternio.cl/mis-cotizaciones'

export type FichaAvisoProveedor = {
  rubro: string
  comuna: string
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
}

export type FichaAvisoComprador = {
  rubro: string
  comuna: string
}

export type EnvioCorreo = {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
}

export type ResultadoCorreo = { ok: true } | { ok: false; motivo: string }

export type ClienteCorreo = (envio: EnvioCorreo) => Promise<ResultadoCorreo>

export function emailConfigurado(apiKey = process.env.RESEND_API_KEY): boolean {
  return Boolean(apiKey?.trim())
}

export function remitenteResend(from = process.env.RESEND_FROM): string {
  const limpio = from?.trim()
  return limpio || REMITENTE_RESEND_DEFAULT
}

export function claveIdempotenciaAvisoLead(leadId: string, proveedorId: string): string {
  return `aviso-lead/${leadId}/${proveedorId}`
}

export function claveIdempotenciaCompraComprador(compraId: string): string {
  return `aviso-compra/${compraId}`
}

export function correoProveedor(entrada: {
  email?: string | null
  usuario?: { email?: string | null } | null
}): string | null {
  const candidatos = [entrada.email, entrada.usuario?.email]
  for (const bruto of candidatos) {
    const email = bruto?.trim().toLowerCase()
    if (email && esCorreoValido(email)) return email
  }
  return null
}

export function proveedoresAAvisar(
  lead: LeadMatch,
  proveedores: Array<ProveedorMatch & { id: string; email: string | null }>,
): Array<{ id: string; email: string }> {
  const vistos = new Set<string>()
  const destinos: Array<{ id: string; email: string }> = []

  for (const proveedor of proveedores) {
    if (!proveedorCubreLead(proveedor, lead)) continue
    const email = correoProveedor(proveedor)
    if (!email) continue
    const clave = `${proveedor.id}:${email}`
    if (vistos.has(proveedor.id) || vistos.has(clave)) continue
    vistos.add(proveedor.id)
    vistos.add(clave)
    destinos.push({ id: proveedor.id, email })
  }

  return destinos
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lineasPrecio(ficha: FichaAvisoProveedor): string[] {
  const lineas: string[] = []
  if (ficha.precioExclusivoClp && ficha.precioExclusivoClp > 0) {
    lineas.push(`Exclusivo: ${formatearClp(ficha.precioExclusivoClp)}`)
  }
  if (ficha.precioCompartidoClp && ficha.precioCompartidoClp > 0) {
    lineas.push(`Compartido: ${formatearClp(ficha.precioCompartidoClp)} (máximo 3 empresas)`)
  }
  return lineas
}

export function correoAvisoLead(ficha: FichaAvisoProveedor): {
  subject: string
  html: string
  text: string
} {
  const precios = lineasPrecio(ficha)
  const subject = `Nueva solicitud en ${ficha.comuna}: ${ficha.rubro}`
  const text = [
    `Hay una solicitud verificada de ${ficha.rubro} en ${ficha.comuna}.`,
    '',
    ...precios,
    '',
    'El contacto está oculto hasta que la tomes.',
    `Ver en tu cuenta: ${URL_PANEL_PROVEEDOR}`,
  ].join('\n')

  const html = [
    `<p>Hay una solicitud verificada de ${escaparHtml(ficha.rubro)} en ${escaparHtml(ficha.comuna)}.</p>`,
    precios.length
      ? `<p>${precios.map((linea) => escaparHtml(linea)).join('<br />')}</p>`
      : '',
    '<p>El contacto está oculto hasta que la tomes.</p>',
    `<p><a href="${URL_PANEL_PROVEEDOR}">Ver en tu cuenta</a></p>`,
  ]
    .filter(Boolean)
    .join('')

  return { subject, html, text }
}

export function correoAvisoCompra(ficha: FichaAvisoComprador): {
  subject: string
  html: string
  text: string
} {
  const subject = 'Una empresa ya tiene tus datos'
  const text = [
    'Una empresa ya tiene tus datos y te va a contactar.',
    '',
    `Pedido: ${ficha.rubro} en ${ficha.comuna}.`,
    '',
    `Sigue tu solicitud: ${URL_MIS_COTIZACIONES}`,
  ].join('\n')

  const html = [
    '<p>Una empresa ya tiene tus datos y te va a contactar.</p>',
    `<p>Pedido: ${escaparHtml(ficha.rubro)} en ${escaparHtml(ficha.comuna)}.</p>`,
    `<p><a href="${URL_MIS_COTIZACIONES}">Ver tus cotizaciones</a></p>`,
  ].join('')

  return { subject, html, text }
}

function clienteResend(apiKey: string): ClienteCorreo {
  const resend = new Resend(apiKey)
  return async (envio) => {
    const { error } = await resend.emails.send(
      {
        from: remitenteResend(),
        to: [envio.to],
        subject: envio.subject,
        html: envio.html,
        text: envio.text,
      },
      { idempotencyKey: envio.idempotencyKey },
    )
    if (error) return { ok: false, motivo: error.message }
    return { ok: true }
  }
}

/** Fail-soft: sin clave o si Resend falla, se loguea y no se lanza. */
export async function enviarCorreo(
  envio: EnvioCorreo,
  deps?: { cliente?: ClienteCorreo; apiKey?: string | undefined },
): Promise<ResultadoCorreo> {
  try {
    if (!esCorreoValido(envio.to)) {
      console.info('[email] destinatario inválido; aviso no enviado.')
      return { ok: false, motivo: 'destinatario' }
    }

    const apiKey = deps?.apiKey ?? process.env.RESEND_API_KEY
    if (!emailConfigurado(apiKey)) {
      console.info('[email] RESEND_API_KEY ausente; aviso no enviado.')
      return { ok: false, motivo: 'sin-clave' }
    }

    const cliente = deps?.cliente ?? clienteResend(apiKey as string)
    return await cliente(envio)
  } catch (error) {
    console.error('[email] fallo al enviar', error)
    return { ok: false, motivo: 'error' }
  }
}
