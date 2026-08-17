/**
 * Score del lead: señales que suman confianza, no filtros que excluyen.
 *
 * Un correo Gmail no descarta un lead, solo le baja el puntaje. Lo que sí es
 * requisito duro para vender es RUT válido + teléfono verificado, y eso se
 * controla con los estados del lead, no con este número.
 */

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
