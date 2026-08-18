/**
 * Casa o empresa: un solo producto, dos audiencias.
 * Filtra el cotizador; no crea dos marketplaces.
 * Persistido en Lead.audiencia como "hogar" | "empresa".
 *
 * La clasificación por rubro vive en Rubro.audiencias (DB).
 * SEMILLA_AUDIENCIAS_POR_SLUG solo alimenta el seed.
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

/**
 * Semilla histórica (antes vivía como fuente de verdad).
 * Solo la usa el seed; el runtime lee Rubro.audiencias.
 */
export const SEMILLA_AUDIENCIAS_POR_SLUG: Record<string, readonly Audiencia[]> = {
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

/** Normaliza audiencias desde DB/JSON. Vacío o basura → ['empresa']. */
export function normalizarAudiencias(valor: unknown): Audiencia[] {
  if (!Array.isArray(valor)) return ['empresa']
  const unicas: Audiencia[] = []
  for (const item of valor) {
    if (typeof item !== 'string') continue
    const a = parsearAudiencia(item)
    if (a && !unicas.includes(a)) unicas.push(a)
  }
  return unicas.length > 0 ? unicas : ['empresa']
}

/** Parseo estricto para formularios: al menos una; rechaza valores inventados. */
export function parsearAudienciasEntrada(valor: unknown): {
  ok: true
  audiencias: Audiencia[]
} | {
  ok: false
  motivo: string
} {
  const lista = Array.isArray(valor)
    ? valor
    : typeof valor === 'string'
      ? valor.split(',')
      : []
  const unicas: Audiencia[] = []
  for (const item of lista) {
    if (typeof item !== 'string' || !item.trim()) continue
    if (!esAudiencia(item.trim())) {
      return { ok: false, motivo: 'La audiencia solo puede ser hogar o empresa.' }
    }
    const a = item.trim() as Audiencia
    if (!unicas.includes(a)) unicas.push(a)
  }
  if (unicas.length === 0) {
    return { ok: false, motivo: 'Elige al menos una audiencia (casa o empresa).' }
  }
  return { ok: true, audiencias: unicas }
}

/** Solo para seed / tests de la semilla. No usar en matching ni home. */
export function audienciasSemilla(slug: string): Audiencia[] {
  return [...(SEMILLA_AUDIENCIAS_POR_SLUG[slug] ?? ['empresa'])]
}

export function audienciasDe(valor: unknown): Audiencia[] {
  return normalizarAudiencias(valor)
}

export function audienciaEsUnica(audiencias: unknown): boolean {
  return audienciasDe(audiencias).length === 1
}

export function audienciaPorDefecto(audiencias: unknown): Audiencia {
  return audienciasDe(audiencias)[0] ?? 'empresa'
}

/**
 * Landings: si el rubro es solo hogar o solo empresa, se precarga.
 * Si es BOTH, se usa el query (?audiencia=) o se deja elegir.
 */
export function audienciaInicialParaPagina(
  audiencias: unknown,
  cruda?: string | null,
): Audiencia | '' {
  const tags = audienciasDe(audiencias)
  const pedida = parsearAudiencia(cruda)
  if (pedida && tags.includes(pedida)) return pedida
  if (tags.length === 1) return tags[0] ?? ''
  return ''
}

export function rubroCalzaAudiencia(audiencias: unknown, audiencia: Audiencia): boolean {
  return audienciasDe(audiencias).includes(audiencia)
}

export function filtrarServiciosPorAudiencia<T extends { audiencias: readonly string[] }>(
  rubros: readonly T[],
  audiencia: Audiencia,
): T[] {
  return rubros.filter((rubro) => rubroCalzaAudiencia(rubro.audiencias, audiencia))
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
export function audienciaParaLead(valor: unknown, audiencias: unknown): Audiencia | null {
  const tags = audienciasDe(audiencias)
  const pedida = parsearAudiencia(valor)
  if (pedida && tags.includes(pedida)) return pedida
  if (tags.length === 1) return tags[0] ?? null
  return null
}

export type PasoCotizador = 'audiencia' | 'servicio' | 'territorio'

/** Un paso a la vez. El CTA aparece cuando ya hay comuna. */
export function pasoCotizador(audiencia: string, slug: string): PasoCotizador {
  if (!audiencia.trim()) return 'audiencia'
  if (!slug.trim()) return 'servicio'
  return 'territorio'
}
