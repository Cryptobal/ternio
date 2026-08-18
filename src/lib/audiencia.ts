/**
 * Casa o empresa: un solo producto, dos audiencias.
 * Filtra el cotizador; no crea dos marketplaces.
 * Persistido en Lead.audiencia como "hogar" | "empresa".
 */

import { slugificarNombre } from '@/lib/territorio'

export const AUDIENCIAS = ['hogar', 'empresa'] as const

export type Audiencia = (typeof AUDIENCIAS)[number]

export const PREGUNTA_AUDIENCIA = '¿Es para tu casa o para tu empresa?'

export const ETIQUETA_AUDIENCIA: Record<Audiencia, string> = {
  hogar: 'Para la casa',
  empresa: 'Para la empresa',
}

/** Segunda línea de las tarjetas del paso 1. */
export const CONTEXTO_AUDIENCIA: Record<Audiencia, string> = {
  hogar: 'Servicios para tu hogar',
  empresa: 'Servicios para tu negocio',
}

/** hogar | empresa | ambos. El overlap es obligatorio: no es un split único. */
const AUDIENCIAS_POR_SLUG: Record<string, readonly Audiencia[]> = {
  'aseo-hogar': ['hogar'],
  'cuidado-adulto-mayor': ['hogar'],
  'tecnico-electrodomesticos': ['hogar'],
  cerrajeria: ['hogar', 'empresa'],
  destape: ['hogar', 'empresa'],
  gasfiteria: ['hogar', 'empresa'],
  electricista: ['hogar', 'empresa'],
  pintura: ['hogar', 'empresa'],
  remodelaciones: ['hogar', 'empresa'],
  mudanzas: ['hogar', 'empresa'],
  jardineria: ['hogar', 'empresa'],
  'control-de-plagas': ['hogar', 'empresa'],
  seguros: ['hogar', 'empresa'],
  'asesoria-financiera': ['hogar', 'empresa'],
  seguridad: ['empresa'],
  aseo: ['empresa'],
  'banos-quimicos': ['empresa'],
  generadores: ['empresa'],
  'transporte-de-personal': ['empresa'],
  'transporte-de-carga': ['empresa'],
  'climatizacion-industrial': ['empresa'],
  contabilidad: ['empresa'],
  'marketing-digital': ['empresa'],
  abogados: ['empresa'],
  reclutamiento: ['empresa'],
}

export function esAudiencia(valor: string): valor is Audiencia {
  return valor === 'hogar' || valor === 'empresa'
}

/** Acepta hogar/empresa y el alias de copy "casa". */
export function parsearAudiencia(valor: unknown): Audiencia | undefined {
  const cruda = String(valor ?? '')
    .trim()
    .toLowerCase()
  if (cruda === 'casa' || cruda === 'hogar') return 'hogar'
  if (cruda === 'empresa') return 'empresa'
  return undefined
}

export function audienciasDe(slug: string): Audiencia[] {
  return [...(AUDIENCIAS_POR_SLUG[slug] ?? ['empresa'])]
}

export function audienciaEsUnica(slug: string): boolean {
  return audienciasDe(slug).length === 1
}

export function audienciaPorDefecto(slug: string): Audiencia {
  return audienciasDe(slug)[0] ?? 'empresa'
}

/**
 * Landings: si el rubro es solo hogar o solo empresa, se precarga.
 * Si es BOTH, se usa el query (?audiencia=) o se deja elegir.
 */
export function audienciaInicialParaPagina(slug: string, cruda?: string | null): Audiencia | '' {
  const pedida = parsearAudiencia(cruda)
  if (pedida && rubroCalzaAudiencia(slug, pedida)) return pedida
  const tags = audienciasDe(slug)
  if (tags.length === 1) return tags[0] ?? ''
  return ''
}

export function rubroCalzaAudiencia(slug: string, audiencia: Audiencia): boolean {
  return audienciasDe(slug).includes(audiencia)
}

export function filtrarServiciosPorAudiencia<T extends { slug: string }>(
  rubros: readonly T[],
  audiencia: Audiencia,
): T[] {
  return rubros.filter((rubro) => rubroCalzaAudiencia(rubro.slug, audiencia))
}

export function filtrarServiciosPorTexto<
  T extends { slug: string; nombre: string; nombrePlural?: string | null },
>(rubros: readonly T[], query: string): T[] {
  const q = slugificarNombre(query.trim())
  if (!q) return [...rubros]
  return rubros.filter((rubro) => {
    const hay = `${slugificarNombre(rubro.nombre)} ${slugificarNombre(rubro.nombrePlural ?? '')} ${rubro.slug}`
    return hay.includes(q)
  })
}

/** Para el lead: query/form si calza; si el rubro es único, se infiere. */
export function audienciaParaLead(valor: unknown, slug: string): Audiencia | null {
  const pedida = parsearAudiencia(valor)
  if (pedida && rubroCalzaAudiencia(slug, pedida)) return pedida
  if (audienciaEsUnica(slug)) return audienciaPorDefecto(slug)
  return null
}

export type PasoCotizador = 'audiencia' | 'servicio' | 'territorio'

/** Un paso a la vez. El CTA aparece cuando ya hay comuna. */
export function pasoCotizador(audiencia: string, slug: string): PasoCotizador {
  if (!audiencia.trim()) return 'audiencia'
  if (!slug.trim()) return 'servicio'
  return 'territorio'
}
