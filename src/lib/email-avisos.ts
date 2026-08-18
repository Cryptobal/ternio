import { formatearClp } from '@/lib/dinero'
import { leadSePuedeVender, proveedorCubreLead, type LeadMatch, type ProveedorMatch } from '@/lib/matching'

export const URL_SITIO_DEFAULT = 'https://www.ternio.cl'

export function urlPublicaSitio(base = process.env.NEXT_PUBLIC_SITIO_URL): string {
  const cruda = (base?.trim() || URL_SITIO_DEFAULT).replace(/\/+$/, '')
  return cruda
}

export function claveAvisoLeadVenta(leadId: string, proveedorId: string): string {
  return `aviso-lead-venta:${leadId}:${proveedorId}`
}

export function claveAvisoLeadTomado(compraId: string): string {
  return `aviso-lead-tomado:${compraId}`
}

export function proveedoresAAvisar<T extends ProveedorMatch>(
  lead: LeadMatch,
  proveedores: T[],
): T[] {
  if (!leadSePuedeVender(lead)) return []
  return proveedores.filter((proveedor) => proveedorCubreLead(proveedor, lead))
}

export function asuntoLeadAVenta(rubro: string, comuna: string): string {
  return `Hay una solicitud de ${rubro} en ${comuna}`
}

export function cuerpoLeadAVenta(ficha: {
  rubro: string
  comuna: string
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
  urlPanel?: string
}): string {
  const lineas = [
    `Hay una solicitud de ${ficha.rubro} en ${ficha.comuna}.`,
    '',
    'Ficha anónima:',
    `Servicio: ${ficha.rubro}`,
    `Comuna: ${ficha.comuna}`,
  ]
  if ((ficha.precioExclusivoClp ?? 0) > 0) {
    lineas.push(`Exclusivo: ${formatearClp(ficha.precioExclusivoClp ?? 0)}`)
  }
  if ((ficha.precioCompartidoClp ?? 0) > 0) {
    lineas.push(`Compartido: ${formatearClp(ficha.precioCompartidoClp ?? 0)} (máximo 3 empresas)`)
  }
  lineas.push('', 'El contacto se revela cuando tomas la solicitud.')
  lineas.push('', ficha.urlPanel ?? `${urlPublicaSitio()}/panel`)
  return lineas.join('\n')
}

export function asuntoLeadTomado(): string {
  return 'Una empresa ya tiene tus datos'
}

export function cuerpoLeadTomado(ficha: {
  rubro: string
  comuna: string
  urlCotizaciones?: string
}): string {
  return [
    'Una empresa ya tiene tus datos y te va a contactar.',
    '',
    `Solicitud: ${ficha.rubro} en ${ficha.comuna}.`,
    '',
    'En tus cotizaciones ves qué pediste y cuántas empresas tomaron.',
    '',
    ficha.urlCotizaciones ?? `${urlPublicaSitio()}/mis-cotizaciones`,
  ].join('\n')
}
