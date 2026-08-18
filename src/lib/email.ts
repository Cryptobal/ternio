import { Resend } from 'resend'

import { formatearClp } from '@/lib/dinero'
import { proveedorCubreLead, type LeadMatch, type ProveedorMatch } from '@/lib/matching'
import { formatearRut, normalizarRut } from '@/lib/rut'
import { esCorreoValido } from '@/lib/validar-identidad'

export const REMITENTE_RESEND_DEFAULT = 'Ternio <avisos@ternio.cl>'
export const ADMIN_AVISO_EMAIL_DEFAULT = 'carlos.irigoyen@gmail.com'
export const SLUG_GARD_OMITIR_AVISO = 'gard-security'
export const URL_PANEL_PROVEEDOR = 'https://www.ternio.cl/panel'
export const URL_MIS_COTIZACIONES = 'https://www.ternio.cl/mis-cotizaciones'
export const URL_ADMIN = 'https://www.ternio.cl/admin'

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

export function emailAdminAvisos(valor = process.env.ADMIN_AVISO_EMAIL): string {
  return valor?.trim() || ADMIN_AVISO_EMAIL_DEFAULT
}

export function claveIdempotenciaAdminLead(leadId: string, estado: string): string {
  return `admin:lead:${leadId}:${estado}`
}

export function claveIdempotenciaAdminProveedorAlta(proveedorId: string): string {
  return `admin:proveedor:${proveedorId}:alta`
}

export function claveIdempotenciaAdminCompra(compraId: string): string {
  return `admin:compra:${compraId}`
}

/** Gard seed / ensureGard: no spamear el alta ficticia. */
export function omitirAvisoAltaProveedor(slug: string): boolean {
  const limpio = slug.trim().toLowerCase()
  return limpio === SLUG_GARD_OMITIR_AVISO || limpio.startsWith('gard')
}

/** El corto “ya verificada” solo si el de creación no fue ya VERIFICADO. */
export function debeAvisarAdminLeadVerificado(estadoAlCrearOAntes: string): boolean {
  return estadoAlCrearOAntes !== 'VERIFICADO'
}

export type FichaAdminLead = {
  rubro: string
  comuna: string
  estado: string
  nombreContacto: string
  email: string
  telefonoE164: string
  rutNormalizado: string
  razonSocial: string | null
  audiencia: string | null
}

export type FichaAdminProveedor = {
  slug: string
  nombre: string
  razonSocial: string | null
  rutNormalizado: string | null
  email: string | null
  telefonoE164: string | null
}

export type FichaAdminCompra = {
  rubro: string
  comuna: string
  tipo: string
  precioClp: number
  creditosConsumidos: number
  proveedorNombre: string
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

function etiquetaAudienciaAdmin(audiencia: string | null): string {
  if (audiencia === 'hogar') return 'casa'
  if (audiencia === 'empresa') return 'empresa'
  return audiencia?.trim() || 'sin dato'
}

function etiquetaEstadoAdmin(estado: string): string {
  switch (estado) {
    case 'VERIFICADO':
      return 'verificada — a la venta'
    case 'LISTA_ESPERA':
      return 'lista de espera'
    case 'EN_REVISION':
      return 'en revisión'
    case 'RECIBIDO':
      return 'pendiente de confirmar teléfono'
    case 'DESCARTADO':
      return 'descartada'
    case 'ARCHIVADO':
      return 'archivada'
    default:
      return estado.toLowerCase()
  }
}

function rutVisible(rut: string | null | undefined): string {
  if (!rut?.trim()) return 'sin RUT'
  const canon = normalizarRut(rut)
  return canon ? formatearRut(canon) : rut
}

function tipoTomaVisible(tipo: string): string {
  return tipo === 'EXCLUSIVO' ? 'exclusivo' : tipo === 'COMPARTIDO' ? 'compartido' : tipo.toLowerCase()
}

function nombreProveedorAdmin(ficha: FichaAdminProveedor): string {
  return ficha.razonSocial?.trim() || ficha.nombre.trim() || ficha.slug
}

export function correoAdminLeadCreado(ficha: FichaAdminLead): {
  subject: string
  html: string
  text: string
} {
  const subject = `Nueva cotización: ${ficha.rubro} en ${ficha.comuna}`
  const lineas = [
    `Nueva cotización de ${ficha.rubro} en ${ficha.comuna}.`,
    `Estado: ${etiquetaEstadoAdmin(ficha.estado)}.`,
    '',
    `Audiencia: ${etiquetaAudienciaAdmin(ficha.audiencia)}`,
    `Razón social: ${ficha.razonSocial?.trim() || 'sin razón social'}`,
    `RUT: ${rutVisible(ficha.rutNormalizado)}`,
    `Nombre: ${ficha.nombreContacto}`,
    `Teléfono: ${ficha.telefonoE164}`,
    `Correo: ${ficha.email}`,
    '',
    `Revisar en el admin: ${URL_ADMIN}`,
    'Entra por /admin/ingresar.',
  ]
  const text = lineas.join('\n')
  const html = [
    `<p>Nueva cotización de ${escaparHtml(ficha.rubro)} en ${escaparHtml(ficha.comuna)}.</p>`,
    `<p>Estado: ${escaparHtml(etiquetaEstadoAdmin(ficha.estado))}.</p>`,
    `<p>Audiencia: ${escaparHtml(etiquetaAudienciaAdmin(ficha.audiencia))}<br />`,
    `Razón social: ${escaparHtml(ficha.razonSocial?.trim() || 'sin razón social')}<br />`,
    `RUT: ${escaparHtml(rutVisible(ficha.rutNormalizado))}<br />`,
    `Nombre: ${escaparHtml(ficha.nombreContacto)}<br />`,
    `Teléfono: ${escaparHtml(ficha.telefonoE164)}<br />`,
    `Correo: ${escaparHtml(ficha.email)}</p>`,
    `<p><a href="${URL_ADMIN}">Revisar en el admin</a> (entra por /admin/ingresar)</p>`,
  ].join('')
  return { subject, html, text }
}

export function correoAdminLeadVerificado(ficha: Pick<FichaAdminLead, 'rubro' | 'comuna'>): {
  subject: string
  html: string
  text: string
} {
  const subject = `Cotización verificada: ${ficha.rubro} en ${ficha.comuna}`
  const text = [
    `La cotización de ${ficha.rubro} en ${ficha.comuna} ya está verificada y a la venta.`,
    '',
    `Revisar en el admin: ${URL_ADMIN}`,
  ].join('\n')
  const html = [
    `<p>La cotización de ${escaparHtml(ficha.rubro)} en ${escaparHtml(ficha.comuna)} ya está verificada y a la venta.</p>`,
    `<p><a href="${URL_ADMIN}">Revisar en el admin</a></p>`,
  ].join('')
  return { subject, html, text }
}

export function correoAdminAltaProveedor(ficha: FichaAdminProveedor): {
  subject: string
  html: string
  text: string
} {
  const nombre = nombreProveedorAdmin(ficha)
  const subject = `Proveedor nuevo: ${nombre}`
  const text = [
    `Se aprobó una cuenta de proveedor: ${nombre}.`,
    '',
    `Slug: ${ficha.slug}`,
    `RUT: ${rutVisible(ficha.rutNormalizado)}`,
    `Teléfono: ${ficha.telefonoE164?.trim() || 'sin teléfono'}`,
    `Correo: ${ficha.email?.trim() || 'sin correo'}`,
    'Créditos de alta: 50.000.',
    '',
    `Revisar en el admin: ${URL_ADMIN}`,
  ].join('\n')
  const html = [
    `<p>Se aprobó una cuenta de proveedor: ${escaparHtml(nombre)}.</p>`,
    `<p>Slug: ${escaparHtml(ficha.slug)}<br />`,
    `RUT: ${escaparHtml(rutVisible(ficha.rutNormalizado))}<br />`,
    `Teléfono: ${escaparHtml(ficha.telefonoE164?.trim() || 'sin teléfono')}<br />`,
    `Correo: ${escaparHtml(ficha.email?.trim() || 'sin correo')}<br />`,
    'Créditos de alta: 50.000.</p>',
    `<p><a href="${URL_ADMIN}">Revisar en el admin</a></p>`,
  ].join('')
  return { subject, html, text }
}

export function correoAdminCompra(ficha: FichaAdminCompra): {
  subject: string
  html: string
  text: string
} {
  const tipo = tipoTomaVisible(ficha.tipo)
  const subject = `Lead tomado: ${ficha.rubro} · ${tipo}`
  const precio = formatearClp(ficha.precioClp)
  const creditos = `${ficha.creditosConsumidos.toLocaleString('es-CL')} créditos`
  const text = [
    `Un proveedor tomó una cotización de ${ficha.rubro} en ${ficha.comuna}.`,
    '',
    `Tipo: ${tipo}`,
    `Precio: ${precio} (${creditos})`,
    `Proveedor: ${ficha.proveedorNombre}`,
    '',
    `Revisar en el admin: ${URL_ADMIN}`,
  ].join('\n')
  const html = [
    `<p>Un proveedor tomó una cotización de ${escaparHtml(ficha.rubro)} en ${escaparHtml(ficha.comuna)}.</p>`,
    `<p>Tipo: ${escaparHtml(tipo)}<br />`,
    `Precio: ${escaparHtml(precio)} (${escaparHtml(creditos)})<br />`,
    `Proveedor: ${escaparHtml(ficha.proveedorNombre)}</p>`,
    `<p><a href="${URL_ADMIN}">Revisar en el admin</a></p>`,
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
