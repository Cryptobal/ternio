/**
 * URLs públicas canónicas vs slugs de BD.
 *
 * Plagas: el slug real (seed y prod) es `control-de-plagas`.
 * Canónica = `/control-de-plagas`. `/plagas` es alias 308.
 */

export type AliasSeo = {
  origen: string
  destino: string
}

/** slug público (si alguien entra por alias) → slug de BD. */
export const SLUG_PUBLICO_A_BD: Record<string, string> = {
  plagas: 'control-de-plagas',
  climatizacion: 'climatizacion-industrial',
}

/** slug de BD → path público. Identity salvo que se declare otra cosa. */
export const SLUG_BD_A_PUBLICO: Record<string, string> = {}

export const RUBROS_VENTA_PUBLICOS = [
  'seguridad',
  'aseo',
  'control-de-plagas',
  'banos-quimicos',
  'generadores',
  'transporte-de-personal',
  'transporte-de-carga',
  'climatizacion-industrial',
] as const

export const ALIAS_SEO_308: AliasSeo[] = [
  { origen: '/guardias-de-seguridad', destino: '/seguridad' },
  { origen: '/guardias', destino: '/seguridad' },
  { origen: '/empresas-de-seguridad', destino: '/seguridad' },
  { origen: '/empresas-de-aseo', destino: '/aseo' },
  { origen: '/plagas', destino: '/control-de-plagas' },
  { origen: '/plagas/:comuna', destino: '/control-de-plagas/:comuna' },
  { origen: '/empresas-de-aseo/:comuna', destino: '/aseo/:comuna' },
  { origen: '/guardias-de-seguridad/:comuna', destino: '/seguridad/:comuna' },
  { origen: '/guardias/:comuna', destino: '/seguridad/:comuna' },
  { origen: '/empresas-de-seguridad/:comuna', destino: '/seguridad/:comuna' },
  { origen: '/climatizacion', destino: '/climatizacion-industrial' },
  { origen: '/climatizacion/:comuna', destino: '/climatizacion-industrial/:comuna' },
]

export function slugBdDesdePublico(slugPublico: string): string {
  return SLUG_PUBLICO_A_BD[slugPublico] ?? slugPublico
}

export function slugPublicoDesdeBd(slugBd: string): string {
  return SLUG_BD_A_PUBLICO[slugBd] ?? slugBd
}

/** Slugs a buscar en BD: el seed usa `control-de-plagas`. */
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
