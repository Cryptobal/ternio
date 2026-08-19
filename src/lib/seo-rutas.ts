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
  gasfiter: 'gasfiteria',
  maestro: 'remodelaciones',
  obras: 'remodelaciones',
  creditos: 'asesoria-financiera',
  guardia: 'seguridad',
  guarda: 'seguridad',
  'guardia-de-seguridad': 'seguridad',
  'guarda-de-seguridad': 'seguridad',
  nana: 'aseo-hogar',
  nanas: 'aseo-hogar',
  'aseo-a-domicilio': 'aseo-hogar',
  'aseo-domicilio': 'aseo-hogar',
  alcantarillado: 'destape',
  'destape-de-alcantarillado': 'destape',
  cerrajero: 'cerrajeria',
  jardinero: 'jardineria',
  mudanza: 'mudanzas',
  fletes: 'mudanzas',
  pintor: 'pintura',
  cuidadora: 'cuidado-adulto-mayor',
  electricistas: 'electricista',
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
  'gasfiteria',
  'electricista',
  'destape',
  'pintura',
  'remodelaciones',
  'cerrajeria',
  'tecnico-electrodomesticos',
  'mudanzas',
  'jardineria',
  'aseo-hogar',
  'cuidado-adulto-mayor',
  'contabilidad',
  'marketing-digital',
  'abogados',
  'reclutamiento',
  'asesoria-financiera',
  'seguros',
] as const

function aliasYCombo(origen: string, destino: string): AliasSeo[] {
  return [
    { origen, destino },
    { origen: `${origen}/:comuna`, destino: `${destino}/:comuna` },
  ]
}

export const ALIAS_SEO_308: AliasSeo[] = [
  ...aliasYCombo('/guardias-de-seguridad', '/seguridad'),
  ...aliasYCombo('/guardias', '/seguridad'),
  ...aliasYCombo('/guardia', '/seguridad'),
  ...aliasYCombo('/guarda', '/seguridad'),
  ...aliasYCombo('/guardia-de-seguridad', '/seguridad'),
  ...aliasYCombo('/guarda-de-seguridad', '/seguridad'),
  ...aliasYCombo('/empresas-de-seguridad', '/seguridad'),
  ...aliasYCombo('/empresas-de-aseo', '/aseo'),
  ...aliasYCombo('/plagas', '/control-de-plagas'),
  ...aliasYCombo('/climatizacion', '/climatizacion-industrial'),
  ...aliasYCombo('/gasfiter', '/gasfiteria'),
  ...aliasYCombo('/maestro', '/remodelaciones'),
  ...aliasYCombo('/obras', '/remodelaciones'),
  ...aliasYCombo('/creditos', '/asesoria-financiera'),
  ...aliasYCombo('/nana', '/aseo-hogar'),
  ...aliasYCombo('/nanas', '/aseo-hogar'),
  ...aliasYCombo('/aseo-a-domicilio', '/aseo-hogar'),
  ...aliasYCombo('/aseo-domicilio', '/aseo-hogar'),
  ...aliasYCombo('/alcantarillado', '/destape'),
  ...aliasYCombo('/destape-de-alcantarillado', '/destape'),
  ...aliasYCombo('/cerrajero', '/cerrajeria'),
  ...aliasYCombo('/jardinero', '/jardineria'),
  ...aliasYCombo('/mudanza', '/mudanzas'),
  ...aliasYCombo('/fletes', '/mudanzas'),
  ...aliasYCombo('/pintor', '/pintura'),
  ...aliasYCombo('/cuidadora', '/cuidado-adulto-mayor'),
  ...aliasYCombo('/electricistas', '/electricista'),
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
