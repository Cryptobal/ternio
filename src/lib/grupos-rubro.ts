/**
 * Agrupación liviana del cotizador. Un solo producto; no son dos marketplaces.
 * Vive en código (no en Prisma) para no arrastrar el client al sitemap.
 */

export const GRUPOS_RUBRO = ['hogar', 'empresa', 'asesoria'] as const

export type GrupoRubro = (typeof GRUPOS_RUBRO)[number]

export const ETIQUETA_GRUPO_RUBRO: Record<GrupoRubro, string> = {
  hogar: 'Hogar',
  empresa: 'Empresa',
  asesoria: 'Asesoría',
}

const GRUPO_POR_SLUG: Record<string, GrupoRubro> = {
  gasfiteria: 'hogar',
  electricista: 'hogar',
  destape: 'hogar',
  pintura: 'hogar',
  remodelaciones: 'hogar',
  cerrajeria: 'hogar',
  'tecnico-electrodomesticos': 'hogar',
  mudanzas: 'hogar',
  jardineria: 'hogar',
  'aseo-hogar': 'hogar',
  'cuidado-adulto-mayor': 'hogar',
  seguridad: 'empresa',
  aseo: 'empresa',
  'control-de-plagas': 'empresa',
  'banos-quimicos': 'empresa',
  generadores: 'empresa',
  'transporte-de-personal': 'empresa',
  'transporte-de-carga': 'empresa',
  'climatizacion-industrial': 'empresa',
  contabilidad: 'empresa',
  'marketing-digital': 'empresa',
  abogados: 'empresa',
  reclutamiento: 'empresa',
  'asesoria-financiera': 'asesoria',
  seguros: 'asesoria',
}

export const SLUGS_OLA_HOGAR = [
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
] as const

export const SLUGS_OLA_EMPRESA = ['contabilidad', 'marketing-digital', 'abogados', 'reclutamiento'] as const

export const SLUGS_OLA_ASESORIA = ['asesoria-financiera', 'seguros'] as const

export const SLUGS_OLA2 = [...SLUGS_OLA_HOGAR, ...SLUGS_OLA_EMPRESA, ...SLUGS_OLA_ASESORIA] as const

export function grupoRubro(slug: string): GrupoRubro {
  return GRUPO_POR_SLUG[slug] ?? 'empresa'
}

export function agruparPorGrupo<T extends { slug: string }>(
  rubros: readonly T[],
): Array<{ id: GrupoRubro; etiqueta: string; rubros: T[] }> {
  const porGrupo = new Map<GrupoRubro, T[]>()
  for (const rubro of rubros) {
    const grupo = grupoRubro(rubro.slug)
    const lista = porGrupo.get(grupo) ?? []
    lista.push(rubro)
    porGrupo.set(grupo, lista)
  }
  return GRUPOS_RUBRO.filter((id) => (porGrupo.get(id)?.length ?? 0) > 0).map((id) => ({
    id,
    etiqueta: ETIQUETA_GRUPO_RUBRO[id],
    rubros: porGrupo.get(id) ?? [],
  }))
}
