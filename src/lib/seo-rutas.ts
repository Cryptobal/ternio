/**
 * URLs públicas canónicas vs slugs de BD.
 *
 * El rubro de plagas en BD es `control-de-plagas`. La canónica pública es
 * `/plagas`. Los alias 308 viven acá y en next.config.ts.
 */

export type AliasSeo = {
  origen: string
  destino: string
}

/** slug público → slug de BD. */
export const SLUG_PUBLICO_A_BD: Record<string, string> = {
  plagas: 'control-de-plagas',
}

/** slug de BD → path público del rubro (sin slash inicial). */
export const SLUG_BD_A_PUBLICO: Record<string, string> = {
  'control-de-plagas': 'plagas',
}

export const RUBROS_VENTA_PUBLICOS = ['seguridad', 'aseo', 'plagas'] as const

export const ALIAS_SEO_308: AliasSeo[] = [
  { origen: '/guardias-de-seguridad', destino: '/seguridad' },
  { origen: '/guardias', destino: '/seguridad' },
  { origen: '/empresas-de-seguridad', destino: '/seguridad' },
  { origen: '/empresas-de-aseo', destino: '/aseo' },
  { origen: '/control-de-plagas', destino: '/plagas' },
  { origen: '/control-de-plagas/:comuna', destino: '/plagas/:comuna' },
  { origen: '/empresas-de-aseo/:comuna', destino: '/aseo/:comuna' },
  { origen: '/guardias-de-seguridad/:comuna', destino: '/seguridad/:comuna' },
  { origen: '/guardias/:comuna', destino: '/seguridad/:comuna' },
  { origen: '/empresas-de-seguridad/:comuna', destino: '/seguridad/:comuna' },
]

export function slugBdDesdePublico(slugPublico: string): string {
  return SLUG_PUBLICO_A_BD[slugPublico] ?? slugPublico
}

export function slugPublicoDesdeBd(slugBd: string): string {
  return SLUG_BD_A_PUBLICO[slugBd] ?? slugBd
}

/**
 * Slugs a buscar en BD. El seed usa `control-de-plagas`; en prod el slug
 * podría ser `plagas`. /plagas no puede 404 por ese desfase.
 */
export function slugsBdCandidatos(slugPublicoOBd: string): string[] {
  return [...new Set([slugPublicoOBd, slugBdDesdePublico(slugPublicoOBd), slugPublicoDesdeBd(slugPublicoOBd)])]
}

export function pathPublicoRubro(slugBd: string): string {
  return `/${slugPublicoDesdeBd(slugBd)}`
}

export function pathPublicoCombo(slugBd: string, comunaSlug: string): string {
  return `${pathPublicoRubro(slugBd)}/${comunaSlug}`
}

export function esAliasQueRedirige(pathname: string): AliasSeo | undefined {
  return ALIAS_SEO_308.find((alias) => alias.origen === pathname)
}
