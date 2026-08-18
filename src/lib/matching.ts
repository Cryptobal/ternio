/**
 * Matching, freshness, Gard y cupos. Funciones puras: el servidor las usa
 * y los tests las cubren sin Prisma.
 *
 * Contrato: docs/guia-de-desarrollo.md
 */

import { leerSnapshotCobertura } from '@/lib/cobertura'

export const GARD_VENTANA_MS = 15 * 60 * 1000
export const VIDA_LEAD_MS = 7 * 24 * 60 * 60 * 1000
export const FRESH_24H_MS = 24 * 60 * 60 * 1000
export const FRESH_72H_MS = 72 * 60 * 60 * 1000
export const CUPOS_COMPARTIDO = 3
export const SLUG_SEGURIDAD = 'seguridad'

export type TipoToma = 'EXCLUSIVO' | 'COMPARTIDO'

export type CompraResumen = {
  tipo: TipoToma
  estado: 'PAGADA' | 'REVERSADA'
  proveedorId?: string
}

export type ProveedorMatch = {
  estado: string
  coberturaNacional: boolean
  slug: string
  solicitudEspera: unknown
  coberturas: Array<{ rubroSlug: string; comunaSlug: string; activa: boolean }>
}

export type LeadMatch = {
  rubroSlug: string
  comunaSlug: string
  estado: string
  modoRubroAlCrear: string
  rutValido: boolean
  telefonoVerificado: boolean
  verificadoAt: Date | null
}

export function esSlugGard(slug: string): boolean {
  return slug === 'gard-security' || slug.startsWith('gard')
}

export function slugsRubroDelProveedor(proveedor: {
  solicitudEspera: unknown
  coberturas: Array<{ rubroSlug: string; activa?: boolean }>
}): string[] {
  const snapshot = leerSnapshotCobertura(proveedor.solicitudEspera)
  const deSnapshot = snapshot?.rubros ?? []
  const deCobertura = proveedor.coberturas
    .filter((fila) => fila.activa !== false)
    .map((fila) => fila.rubroSlug)
  return [...new Set([...deSnapshot, ...deCobertura])]
}

export function proveedorCubreLead(proveedor: ProveedorMatch, lead: LeadMatch): boolean {
  if (proveedor.estado !== 'APROBADO') return false
  const rubros = slugsRubroDelProveedor(proveedor)
  if (!rubros.includes(lead.rubroSlug)) return false
  if (proveedor.coberturaNacional) return true
  return proveedor.coberturas.some(
    (fila) =>
      fila.activa &&
      fila.rubroSlug === lead.rubroSlug &&
      fila.comunaSlug === lead.comunaSlug,
  )
}

export function leadSePuedeVender(lead: LeadMatch, ahora = new Date()): boolean {
  if (lead.estado !== 'VERIFICADO') return false
  if (lead.modoRubroAlCrear !== 'VENTA') return false
  if (!lead.rutValido || !lead.telefonoVerificado) return false
  if (!lead.verificadoAt) return false
  return ahora.getTime() - lead.verificadoAt.getTime() < VIDA_LEAD_MS
}

export function factorFreshness(verificadoAt: Date, ahora = new Date()): number | null {
  const edad = ahora.getTime() - verificadoAt.getTime()
  if (edad < 0 || edad >= VIDA_LEAD_MS) return null
  if (edad < FRESH_24H_MS) return 1
  if (edad < FRESH_72H_MS) return 0.8
  return 0.5
}

export function precioVigente(
  precioBaseClp: number | null | undefined,
  verificadoAt: Date | null,
  ahora = new Date(),
): number | null {
  if (!precioBaseClp || precioBaseClp <= 0 || !verificadoAt) return null
  const factor = factorFreshness(verificadoAt, ahora)
  if (factor === null) return null
  return Math.round(precioBaseClp * factor)
}

export function resumenCupos(compras: CompraResumen[]): {
  pagadas: number
  hayExclusivo: boolean
  cuposCompartidoRestantes: number
  puedeExclusivo: boolean
  puedeCompartido: boolean
} {
  const pagadas = compras.filter((compra) => compra.estado === 'PAGADA')
  const hayExclusivo = pagadas.some((compra) => compra.tipo === 'EXCLUSIVO')
  const ocupados = hayExclusivo ? CUPOS_COMPARTIDO : pagadas.length
  const cuposCompartidoRestantes = Math.max(0, CUPOS_COMPARTIDO - ocupados)
  return {
    pagadas: pagadas.length,
    hayExclusivo,
    cuposCompartidoRestantes,
    puedeExclusivo: pagadas.length === 0,
    puedeCompartido: !hayExclusivo && pagadas.length < CUPOS_COMPARTIDO,
  }
}

export type FaseGard = 'libre' | 'reservado' | 'para-gard'

export function faseVentanaGard(args: {
  rubroSlug: string
  verificadoAt: Date | null
  hayGardQueCalza: boolean
  slugProveedor: string
  ahora?: Date
}): { fase: FaseGard; restanteMs: number } {
  const ahora = args.ahora ?? new Date()
  if (args.rubroSlug !== SLUG_SEGURIDAD || !args.hayGardQueCalza || !args.verificadoAt) {
    return { fase: 'libre', restanteMs: 0 }
  }
  const restanteMs = args.verificadoAt.getTime() + GARD_VENTANA_MS - ahora.getTime()
  if (restanteMs <= 0) return { fase: 'libre', restanteMs: 0 }
  if (esSlugGard(args.slugProveedor)) return { fase: 'para-gard', restanteMs }
  return { fase: 'reservado', restanteMs }
}

export function minutosRestantes(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000))
}

export function puedeTomarLead(args: {
  proveedor: ProveedorMatch
  lead: LeadMatch
  tipo: TipoToma
  compras: CompraResumen[]
  saldo: number
  precioClp: number | null
  hayGardQueCalza: boolean
  ahora?: Date
}): { ok: true } | { ok: false; motivo: string } {
  const ahora = args.ahora ?? new Date()
  if (!leadSePuedeVender(args.lead, ahora)) {
    return { ok: false, motivo: 'Este comprador ya no está a la venta.' }
  }
  if (!proveedorCubreLead(args.proveedor, args.lead)) {
    return { ok: false, motivo: 'Este comprador no está en tu cobertura.' }
  }
  const gard = faseVentanaGard({
    rubroSlug: args.lead.rubroSlug,
    verificadoAt: args.lead.verificadoAt,
    hayGardQueCalza: args.hayGardQueCalza,
    slugProveedor: args.proveedor.slug,
    ahora,
  })
  if (gard.fase === 'reservado') {
    return {
      ok: false,
      motivo: `Disponible en ${minutosRestantes(gard.restanteMs)} min.`,
    }
  }
  const cupos = resumenCupos(args.compras)
  if (args.tipo === 'EXCLUSIVO' && !cupos.puedeExclusivo) {
    return { ok: false, motivo: 'Ya no queda el cupo exclusivo.' }
  }
  if (args.tipo === 'COMPARTIDO' && !cupos.puedeCompartido) {
    return { ok: false, motivo: 'Ya no quedan cupos compartidos.' }
  }
  if (!args.precioClp || args.precioClp <= 0) {
    return { ok: false, motivo: 'Este servicio no tiene precio de venta.' }
  }
  if (args.saldo < args.precioClp) {
    return { ok: false, motivo: 'No te alcanzan los créditos para este contacto.' }
  }
  return { ok: true }
}
