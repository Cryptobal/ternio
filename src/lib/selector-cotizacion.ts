import { pathPublicoCombo, pathPublicoRubro } from '@/lib/seo-rutas'

/**
 * Destino del selector de cotización de la home.
 *
 * Combo publicado (RubroComuna activa) → URL pública canónica
 * Comuna sin página SEO → /{rubro}?comuna=
 * Sin comuna → /{rubro}
 */

export type ModoSelector = 'VENTA' | 'CAPTURA'

export type RubroSelector = {
  slug: string
  nombre: string
  nombrePlural: string | null
  descripcion: string | null
  modo: ModoSelector
  comunas: { slug: string; nombre: string }[]
}

export function destinoSelector(
  rubro: Pick<RubroSelector, 'slug' | 'modo'>,
  comunaSlug?: string,
  publicado = false,
): string {
  const comuna = comunaSlug?.trim()
  if (comuna && publicado) return pathPublicoCombo(rubro.slug, comuna)
  if (comuna) return `${pathPublicoRubro(rubro.slug)}?comuna=${encodeURIComponent(comuna)}`
  return pathPublicoRubro(rubro.slug)
}

export function claveCombo(rubroSlug: string, comunaSlug: string): string {
  return `${rubroSlug}/${comunaSlug}`
}

/** Rubros que se venden. CAPTURA no entra a la venta. */
export function rubrosEnVenta<T extends { modo: string }>(rubros: readonly T[]): T[] {
  return rubros.filter((rubro) => rubro.modo === 'VENTA')
}
