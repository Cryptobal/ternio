/**
 * Destino del selector de cotización de la home.
 *
 * VENTA + comuna → /{rubro}/{comuna}
 * VENTA sin comuna → /{rubro}
 * CAPTURA → /{rubro} (lista de espera)
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
): string {
  if (rubro.modo === 'VENTA' && comunaSlug) {
    return `/${rubro.slug}/${comunaSlug}`
  }
  return `/${rubro.slug}`
}
