/**
 * Destino del selector de cotización de la home.
 *
 * Combo publicado (RubroComuna activa) → /{rubro}/{comuna}
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
  if (comuna && publicado) return `/${rubro.slug}/${comuna}`
  if (comuna) return `/${rubro.slug}?comuna=${encodeURIComponent(comuna)}`
  return `/${rubro.slug}`
}

export function claveCombo(rubroSlug: string, comunaSlug: string): string {
  return `${rubroSlug}/${comunaSlug}`
}
