/**
 * Casa o empresa: un solo producto, dos audiencias.
 * Filtra el combobox; no crea dos marketplaces.
 */

import { slugificarNombre } from '@/lib/territorio'

export const AUDIENCIAS = ['casa', 'empresa'] as const

export type Audiencia = (typeof AUDIENCIAS)[number]

export const PREGUNTA_AUDIENCIA = '¿Es para tu casa o para tu empresa?'

export const ETIQUETA_AUDIENCIA: Record<Audiencia, string> = {
  casa: 'Para la casa',
  empresa: 'Para la empresa',
}

const AUDIENCIAS_POR_SLUG: Record<string, readonly Audiencia[]> = {
  gasfiteria: ['casa', 'empresa'],
  electricista: ['casa', 'empresa'],
  destape: ['casa', 'empresa'],
  pintura: ['casa', 'empresa'],
  remodelaciones: ['casa', 'empresa'],
  cerrajeria: ['casa', 'empresa'],
  'tecnico-electrodomesticos': ['casa'],
  mudanzas: ['casa', 'empresa'],
  jardineria: ['casa', 'empresa'],
  'aseo-hogar': ['casa'],
  'cuidado-adulto-mayor': ['casa'],
  seguridad: ['empresa'],
  aseo: ['empresa'],
  'control-de-plagas': ['empresa'],
  'banos-quimicos': ['empresa'],
  generadores: ['empresa'],
  'transporte-de-personal': ['empresa'],
  'transporte-de-carga': ['empresa'],
  'climatizacion-industrial': ['empresa'],
  contabilidad: ['empresa'],
  'marketing-digital': ['empresa'],
  abogados: ['casa', 'empresa'],
  reclutamiento: ['empresa'],
  'asesoria-financiera': ['casa', 'empresa'],
  seguros: ['casa', 'empresa'],
}

export function esAudiencia(valor: string): valor is Audiencia {
  return valor === 'casa' || valor === 'empresa'
}

export function audienciasDe(slug: string): Audiencia[] {
  return [...(AUDIENCIAS_POR_SLUG[slug] ?? ['empresa'])]
}

export function audienciaPorDefecto(slug: string): Audiencia {
  return audienciasDe(slug)[0] ?? 'empresa'
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

export type PasoCotizador = 'audiencia' | 'servicio' | 'territorio'

/** Un paso a la vez. El CTA aparece cuando ya hay comuna (el territorio lo decide). */
export function pasoCotizador(audiencia: string, slug: string): PasoCotizador {
  if (!audiencia.trim()) return 'audiencia'
  if (!slug.trim()) return 'servicio'
  return 'territorio'
}
