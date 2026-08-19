import type { PasoCotizacion } from '@/lib/pasos-cotizacion'

export type FaseCotizacion = 'necesidad' | 'detalles' | 'datos'

export const FASES = [
  { id: 'necesidad' as const, etiqueta: 'Qué necesitas' },
  { id: 'detalles' as const, etiqueta: 'Detalles' },
  { id: 'datos' as const, etiqueta: 'Tus datos' },
]

export type TramoFase = {
  fase: FaseCotizacion
  etiqueta: string
  completo: number
}

export function faseDePaso(paso: PasoCotizacion): FaseCotizacion {
  if (paso.tipo === 'comuna') return 'necesidad'
  if (paso.tipo === 'modulo') return 'detalles'
  return 'datos'
}

function completoFase(
  pasos: PasoCotizacion[],
  indice: number,
  fase: FaseCotizacion,
  necesidadPrevia: boolean,
): number {
  const deFase = pasos.filter((paso) => faseDePaso(paso) === fase)

  if (deFase.length === 0) {
    if (fase === 'necesidad') return necesidadPrevia ? 1 : 0
    // Sin campos del rubro: la fase no bloquea; se marca completa.
    return 1
  }

  if (necesidadPrevia && fase === 'necesidad') return 1

  const hechos = deFase.filter((paso) => pasos.indexOf(paso) < indice).length
  return hechos / deFase.length
}

/**
 * Progreso del riel de tres fases en el formulario.
 * `necesidadPrevia` = la comuna ya vino en la URL (fase 1 completa).
 */
export function progresoFases(
  pasos: PasoCotizacion[],
  indice: number,
  opciones: { necesidadPrevia?: boolean } = {},
): TramoFase[] {
  const necesidadPrevia = opciones.necesidadPrevia ?? false
  const seguro = Math.max(0, Math.min(indice, Math.max(pasos.length - 1, 0)))

  return FASES.map(({ id, etiqueta }) => ({
    fase: id,
    etiqueta,
    completo: completoFase(pasos, seguro, id, necesidadPrevia),
  }))
}

/**
 * Progreso de la fase 1 en el selector de la home / landing sin comuna.
 * Tres tramos fijos: audiencia → servicio → comuna.
 */
export function progresoSelectorNecesidad(
  audiencia: string,
  slug: string,
  comunaSlug: string,
): TramoFase[] {
  const hechos = (audiencia ? 1 : 0) + (slug ? 1 : 0) + (comunaSlug ? 1 : 0)
  return [
    { fase: 'necesidad', etiqueta: 'Qué necesitas', completo: hechos / 3 },
    { fase: 'detalles', etiqueta: 'Detalles', completo: 0 },
    { fase: 'datos', etiqueta: 'Tus datos', completo: 0 },
  ]
}

/** Primera fase incompleta; si todas están al 100 %, la última. */
export function faseActivaDe(tramos: TramoFase[]): FaseCotizacion {
  for (const tramo of tramos) {
    if (tramo.completo < 1) return tramo.fase
  }
  return 'datos'
}
