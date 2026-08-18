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

function conAudiencia(path: string, audiencia?: string): string {
  const valor = audiencia?.trim()
  if (!valor) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}audiencia=${encodeURIComponent(valor)}`
}

export function destinoSelector(
  rubro: Pick<RubroSelector, 'slug' | 'modo'>,
  comunaSlug?: string,
  publicado = false,
  audiencia?: string,
): string {
  const comuna = comunaSlug?.trim()
  if (comuna && publicado) return conAudiencia(pathPublicoCombo(rubro.slug, comuna), audiencia)
  if (comuna) {
    return conAudiencia(
      `${pathPublicoRubro(rubro.slug)}?comuna=${encodeURIComponent(comuna)}`,
      audiencia,
    )
  }
  return conAudiencia(pathPublicoRubro(rubro.slug), audiencia)
}

export function claveCombo(rubroSlug: string, comunaSlug: string): string {
  return `${rubroSlug}/${comunaSlug}`
}

/** Rubros que se venden. CAPTURA no entra a la venta. */
export function rubrosEnVenta<T extends { modo: string }>(rubros: readonly T[]): T[] {
  return rubros.filter((rubro) => rubro.modo === 'VENTA')
}
