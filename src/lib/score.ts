/**
 * Score del lead: señales que suman confianza, no filtros que excluyen.
 *
 * Un correo Gmail no descarta un lead, solo le baja el puntaje. Lo que sí es
 * requisito duro para vender es RUT válido + teléfono verificado, y eso se
 * controla con los estados del lead, no con este número.
 *
 * En hogar el tope es 90: el +10 de razón social no aplica (no se inventan
 * puntos compensatorios).
 */

import type { Audiencia } from '@/lib/audiencia'

const DOMINIOS_GENERICOS = new Set([
  'gmail.com',
  'hotmail.com',
  'hotmail.cl',
  'outlook.com',
  'outlook.cl',
  'yahoo.com',
  'yahoo.es',
  'live.cl',
  'icloud.com',
  'proton.me',
  'protonmail.com',
])

export type SenalesScore = {
  rutValido: boolean
  telefonoVerificado: boolean
  email: string
  esMovil: boolean
  razonSocialDeclarada: boolean
  largoDetalle: number
  plazo?: string | undefined
}

export const SCORE_MAXIMO = 100
/** Tope hogar: sin el bonus de razón social (+10). */
export const SCORE_MAXIMO_HOGAR = 90

export function scoreMaximoPorAudiencia(audiencia: Audiencia | null | undefined): number {
  return audiencia === 'hogar' ? SCORE_MAXIMO_HOGAR : SCORE_MAXIMO
}

export function esCorreoCorporativo(email: string): boolean {
  const dominio = email.trim().toLowerCase().split('@')[1]
  if (!dominio) return false
  return !DOMINIOS_GENERICOS.has(dominio)
}

/** Puntaje 0–100, determinista y explicable. */
export function calcularScore(senales: SenalesScore): number {
  let score = 0

  if (senales.rutValido) score += 30
  if (senales.telefonoVerificado) score += 25
  if (senales.esMovil) score += 5
  if (esCorreoCorporativo(senales.email)) score += 20
  if (senales.razonSocialDeclarada) score += 10
  if (senales.largoDetalle >= 40) score += 5
  if (senales.plazo === 'urgente' || senales.plazo === 'este_mes') score += 5

  return Math.min(score, SCORE_MAXIMO)
}
