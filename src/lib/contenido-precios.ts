/**
 * Copy y helpers puros de /precios.
 * Los montos salen de los rubros en VENTA; la escalera usa precioVigente.
 */

import { formatearClp } from '@/lib/dinero'
import {
  FRESH_24H_MS,
  FRESH_72H_MS,
  VIDA_LEAD_MS,
  precioVigente,
} from '@/lib/matching'
import { audienciasDe, type Audiencia } from '@/lib/audiencia'

export const HERO_PRECIOS = {
  titulo: 'Si cotizas, no pagas. Si vendes, pagas por contacto.',
  bajada: 'El comprador siempre es gratis. El proveedor compra créditos solo cuando el contacto le sirve.',
} as const

export const RAZONES_COMPRADOR = [
  'Cotizar es gratis',
  'No pedimos tarjeta',
  'No cobramos comisión sobre el trabajo',
  'Máximo tres empresas te contactan',
] as const

export const VACIO_PROVEEDOR = 'Todavía no hay servicios abiertos a la venta.'

export type RubroPrecio = {
  slug: string
  nombre: string
  modo: string
  audiencias: readonly string[]
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
  precioExclusivoHogarClp?: number | null
  precioCompartidoHogarClp?: number | null
}

export type PrecioMostrable = {
  slug: string
  nombre: string
  audiencias: Audiencia[]
  exclusivoEmpresa: number
  compartidoEmpresa: number
  exclusivoHogar: number | null
  compartidoHogar: number | null
}

/** Solo VENTA con ambos precios de empresa > 0. */
export function rubrosConPrecioPublico(rubros: readonly RubroPrecio[]): PrecioMostrable[] {
  return rubros
    .filter(
      (r) =>
        r.modo === 'VENTA' &&
        (r.precioExclusivoClp ?? 0) > 0 &&
        (r.precioCompartidoClp ?? 0) > 0,
    )
    .map((r) => {
      const exclusivoHogar =
        (r.precioExclusivoHogarClp ?? 0) > 0 ? r.precioExclusivoHogarClp! : null
      const compartidoHogar =
        (r.precioCompartidoHogarClp ?? 0) > 0 ? r.precioCompartidoHogarClp! : null
      return {
        slug: r.slug,
        nombre: r.nombre,
        audiencias: audienciasDe(r.audiencias),
        exclusivoEmpresa: r.precioExclusivoClp!,
        compartidoEmpresa: r.precioCompartidoClp!,
        exclusivoHogar,
        compartidoHogar,
      }
    })
}

/** Mínimo entre compartidos (empresa y hogar si existen). */
export function precioDesdeMinimo(rubros: readonly PrecioMostrable[]): number | null {
  let min: number | null = null
  for (const r of rubros) {
    const candidatos = [r.compartidoEmpresa]
    if (r.compartidoHogar != null) candidatos.push(r.compartidoHogar)
    for (const n of candidatos) {
      if (min === null || n < min) min = n
    }
  }
  return min
}

export function etiquetaDesde(minimo: number | null): string {
  if (minimo == null) return VACIO_PROVEEDOR
  return `desde ${formatearClp(minimo)}`
}

export type EscalónFrescura = {
  id: string
  etiqueta: string
  factor: number | null
  /** Ancho relativo de la barra (0–100). */
  barraPct: number
  precioEjemplo: number | null
}

/**
 * Cuatro filas alineadas con precioVigente / factorFreshness.
 * Usa un verificadoAt sintético para cada tramo.
 */
export function escalonesFrescura(precioBase: number): EscalónFrescura[] {
  const ancla = new Date('2026-01-01T12:00:00.000Z')
  const ahora24 = new Date(ancla.getTime() + 1 * 60 * 60 * 1000)
  const ahora72 = new Date(ancla.getTime() + 36 * 60 * 60 * 1000)
  const ahora7d = new Date(ancla.getTime() + 4 * 24 * 60 * 60 * 1000)
  const ahoraArch = new Date(ancla.getTime() + VIDA_LEAD_MS + 60_000)

  return [
    {
      id: '100',
      etiqueta: 'Hasta 24 h',
      factor: 1,
      barraPct: 100,
      precioEjemplo: precioVigente(precioBase, ancla, ahora24),
    },
    {
      id: '80',
      etiqueta: 'Hasta 72 h',
      factor: 0.8,
      barraPct: 80,
      precioEjemplo: precioVigente(precioBase, ancla, ahora72),
    },
    {
      id: '50',
      etiqueta: 'Hasta 7 días',
      factor: 0.5,
      barraPct: 50,
      precioEjemplo: precioVigente(precioBase, ancla, ahora7d),
    },
    {
      id: 'archivo',
      etiqueta: 'Después se archiva',
      factor: null,
      barraPct: 0,
      precioEjemplo: precioVigente(precioBase, ancla, ahoraArch),
    },
  ]
}

export function rubroAtiendeAmbas(rubro: PrecioMostrable): boolean {
  return rubro.audiencias.includes('hogar') && rubro.audiencias.includes('empresa')
}

export function preciosPorAudiencia(
  rubro: PrecioMostrable,
  audiencia: Audiencia,
): { exclusivo: number; compartido: number } | null {
  if (audiencia === 'hogar') {
    if (rubro.exclusivoHogar == null || rubro.compartidoHogar == null) return null
    return { exclusivo: rubro.exclusivoHogar, compartido: rubro.compartidoHogar }
  }
  return { exclusivo: rubro.exclusivoEmpresa, compartido: rubro.compartidoEmpresa }
}

/** Reexport para tests de alineación con matching. */
export { FRESH_24H_MS, FRESH_72H_MS, VIDA_LEAD_MS, precioVigente }
