import { ModoRubro } from '@prisma/client'

/**
 * Los 5 rubros que nacieron en CAPTURA (lista de espera) y pasan a VENTA.
 * No incluye seguridad / aseo / plagas (ya VENTA) ni “Prueba E2E”.
 */
export const SLUGS_ACTIVAR_VENTA = [
  'banos-quimicos',
  'generadores',
  'transporte-de-personal',
  'transporte-de-carga',
  'climatizacion-industrial',
] as const

export type SlugActivarVenta = (typeof SLUGS_ACTIVAR_VENTA)[number]

export const PRECIOS_ACTIVAR_VENTA: Record<
  SlugActivarVenta,
  { precioExclusivoClp: number; precioCompartidoClp: number }
> = {
  'banos-quimicos': { precioExclusivoClp: 15_000, precioCompartidoClp: 6_000 },
  generadores: { precioExclusivoClp: 25_000, precioCompartidoClp: 10_000 },
  'transporte-de-personal': { precioExclusivoClp: 20_000, precioCompartidoClp: 8_000 },
  'transporte-de-carga': { precioExclusivoClp: 20_000, precioCompartidoClp: 8_000 },
  'climatizacion-industrial': { precioExclusivoClp: 25_000, precioCompartidoClp: 10_000 },
}

export function esSlugActivarVenta(slug: string): slug is SlugActivarVenta {
  return (SLUGS_ACTIVAR_VENTA as readonly string[]).includes(slug)
}

export function esRubroPruebaE2E(slug: string, nombre?: string | null): boolean {
  const s = slug.trim().toLowerCase()
  const n = (nombre ?? '').trim().toLowerCase()
  return s === 'prueba-e2e' || s.startsWith('prueba-e2e') || n.includes('prueba e2e')
}

/** Si admin/seed ya tiene un precio > 0, se respeta. */
export function precioVentaSinPisar(actual: number | null | undefined, semilla: number): number {
  return typeof actual === 'number' && actual > 0 ? actual : semilla
}

export function contenidoSeoEsListaEspera(valor: unknown): boolean {
  const texto = JSON.stringify(valor ?? '').toLowerCase()
  return (
    texto.includes('te avisamos') ||
    texto.includes('lista de espera') ||
    texto.includes('sumando empresas')
  )
}

export type RubroExistenteActivacion = {
  slug: string
  nombre?: string | null
  modo: ModoRubro | string
  activo: boolean
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
  contenidoSeo?: unknown
}

export type CambioActivacionVenta = {
  modo: 'VENTA'
  precioExclusivoClp: number
  precioCompartidoClp: number
  actualizarContenidoSeo: boolean
}

/**
 * Qué hay que escribir en un rubro de lista de espera para pasarlo a VENTA.
 * No reactiva filas apagadas. No toca “Prueba E2E”.
 */
export function cambioActivacionVenta(
  existente: RubroExistenteActivacion,
  semilla: {
    precioExclusivoClp: number | null
    precioCompartidoClp: number | null
    contenidoSeo?: unknown
  },
): CambioActivacionVenta | null {
  if (esRubroPruebaE2E(existente.slug, existente.nombre)) return null
  if (!existente.activo) return null
  if (!esSlugActivarVenta(existente.slug)) return null

  const fallback = PRECIOS_ACTIVAR_VENTA[existente.slug]
  const exclusivo = precioVentaSinPisar(
    existente.precioExclusivoClp,
    semilla.precioExclusivoClp && semilla.precioExclusivoClp > 0
      ? semilla.precioExclusivoClp
      : fallback.precioExclusivoClp,
  )
  const compartido = precioVentaSinPisar(
    existente.precioCompartidoClp,
    semilla.precioCompartidoClp && semilla.precioCompartidoClp > 0
      ? semilla.precioCompartidoClp
      : fallback.precioCompartidoClp,
  )

  const yaVenta = existente.modo === ModoRubro.VENTA || existente.modo === 'VENTA'
  const preciosListos =
    existente.precioExclusivoClp === exclusivo && existente.precioCompartidoClp === compartido
  const seoEspera = contenidoSeoEsListaEspera(existente.contenidoSeo)

  if (yaVenta && preciosListos && !seoEspera) return null

  return {
    modo: 'VENTA',
    precioExclusivoClp: exclusivo,
    precioCompartidoClp: compartido,
    actualizarContenidoSeo: seoEspera,
  }
}
