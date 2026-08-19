/**
 * Matching, freshness, Gard y cupos. Funciones puras: el servidor las usa
 * y los tests las cubren sin Prisma.
 *
 * Contrato: docs/guia-de-desarrollo.md
 */

import { leerSnapshotCobertura } from '@/lib/cobertura'
import { audienciasDe, type Audiencia } from '@/lib/audiencia'
import { normalizarRut } from '@/lib/rut'

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
  coberturas: Array<{
    rubroSlug: string
    comunaSlug: string
    activa: boolean
    audiencias?: readonly string[]
  }>
}

export type LeadMatch = {
  rubroSlug: string
  comunaSlug: string
  /** Nombre CUT, p. ej. `Región Metropolitana`. */
  region: string
  /** Nombre CUT, p. ej. `Santiago`. */
  provincia: string
  estado: string
  modoRubroAlCrear: string
  rutValido: boolean
  telefonoVerificado: boolean
  verificadoAt: Date | null
  /**
   * hogar | empresa. Null = lead anterior a la migración: compatible con
   * todos los proveedores y precio de empresa.
   */
  audiencia: Audiencia | null
}

export type PreciosRubroMatch = {
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
  precioExclusivoHogarClp?: number | null
  precioCompartidoHogarClp?: number | null
}

/**
 * Resuelve el precio base según audiencia del lead, antes de freshness.
 * Fail-closed: sin precio de hogar no cae al de empresa.
 */
export function precioBasePorAudiencia(args: {
  audiencia: Audiencia | null
  tipo: TipoToma
  rubro: PreciosRubroMatch
}): number | null {
  const audiencia = args.audiencia ?? 'empresa'
  if (audiencia === 'hogar') {
    return args.tipo === 'EXCLUSIVO'
      ? (args.rubro.precioExclusivoHogarClp ?? null)
      : (args.rubro.precioCompartidoHogarClp ?? null)
  }
  return args.tipo === 'EXCLUSIVO'
    ? args.rubro.precioExclusivoClp
    : args.rubro.precioCompartidoClp
}

/** Audiencias que el proveedor declara para un rubro (filas o snapshot). */
export function audienciasProveedorParaRubro(
  proveedor: Pick<ProveedorMatch, 'solicitudEspera' | 'coberturas'>,
  rubroSlug: string,
): Audiencia[] {
  const deFilas = proveedor.coberturas.filter(
    (fila) => fila.activa !== false && fila.rubroSlug === rubroSlug,
  )
  if (deFilas.length > 0) {
    const primera = deFilas[0]
    if (primera?.audiencias && primera.audiencias.length > 0) {
      return audienciasDe(primera.audiencias)
    }
  }

  const snap = leerSnapshotCobertura(proveedor.solicitudEspera)
  const delSnap = snap?.audienciasPorRubro?.[rubroSlug]
  if (delSnap && delSnap.length > 0) return audienciasDe(delSnap)

  // Sin dato (migración incompleta): no perder avisos.
  return ['hogar', 'empresa']
}

/**
 * Lead.audiencia null (histórico) calza con todos.
 * Si no, el proveedor debe declarar esa audiencia en el rubro.
 */
export function proveedorAtiendeAudiencia(
  proveedor: Pick<ProveedorMatch, 'solicitudEspera' | 'coberturas'>,
  lead: Pick<LeadMatch, 'rubroSlug' | 'audiencia'>,
): boolean {
  if (lead.audiencia == null) return true
  return audienciasProveedorParaRubro(proveedor, lead.rubroSlug).includes(lead.audiencia)
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

/**
 * Nacional cubre todo. Un snapshot de Región Metropolitana cubre
 * Providencia aunque no haya fila `Cobertura`. La fila activa
 * (rubro + comuna) también cubre.
 */
export function geografiaCubreLead(
  proveedor: Pick<ProveedorMatch, 'coberturaNacional' | 'solicitudEspera' | 'coberturas'>,
  lead: Pick<LeadMatch, 'rubroSlug' | 'comunaSlug' | 'region' | 'provincia'>,
): boolean {
  if (proveedor.coberturaNacional) return true

  const snap = leerSnapshotCobertura(proveedor.solicitudEspera)
  if (snap?.modo === 'nacional') return true

  if (snap?.modo === 'region' && lead.region && snap.regiones.includes(lead.region)) {
    return true
  }

  if (
    snap?.modo === 'provincia' &&
    lead.provincia &&
    snap.provincias.some((item) => item.region === lead.region && item.provincia === lead.provincia)
  ) {
    return true
  }

  if (snap?.modo === 'comuna' && snap.comunas.includes(lead.comunaSlug)) {
    return true
  }

  return proveedor.coberturas.some(
    (fila) =>
      fila.activa &&
      fila.rubroSlug === lead.rubroSlug &&
      fila.comunaSlug === lead.comunaSlug,
  )
}

export function proveedorCubreLead(proveedor: ProveedorMatch, lead: LeadMatch): boolean {
  if (proveedor.estado !== 'APROBADO') return false
  const rubros = slugsRubroDelProveedor(proveedor)
  if (!rubros.includes(lead.rubroSlug)) return false
  if (!proveedorAtiendeAudiencia(proveedor, lead)) return false
  return geografiaCubreLead(proveedor, lead)
}

export type ComboPublico = {
  rubroSlug: string
  comunaSlug: string
  region: string
  provincia: string
}

/**
 * Proveedor APROBADO que cubre rubro+comuna (listado SEO).
 * No filtra por audiencia: la ficha pública no es un lead.
 */
export function proveedorVisibleEnCombo(
  proveedor: ProveedorMatch,
  combo: ComboPublico,
): boolean {
  if (proveedor.estado !== 'APROBADO') return false
  const rubros = slugsRubroDelProveedor(proveedor)
  if (!rubros.includes(combo.rubroSlug)) return false
  return geografiaCubreLead(proveedor, {
    rubroSlug: combo.rubroSlug,
    comunaSlug: combo.comunaSlug,
    region: combo.region,
    provincia: combo.provincia,
  })
}

/** Orden estable: con logo primero, luego nombre. Tope para la landing. */
export function ordenarProveedoresPublicos<T extends { logoUrl?: string | null; nombre: string }>(
  filas: readonly T[],
  tope = 12,
): T[] {
  return [...filas]
    .sort((a, b) => {
      const logoA = a.logoUrl ? 0 : 1
      const logoB = b.logoUrl ? 0 : 1
      if (logoA !== logoB) return logoA - logoB
      return a.nombre.localeCompare(b.nombre, 'es')
    })
    .slice(0, tope)
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

/**
 * Tramos de freshness para la UI (sin timers en vivo).
 * 0 = 100 %, 1 = 80 %, 2 = 50 %, 3 = archivado.
 */
export type TramoFreshness = {
  tramo: 0 | 1 | 2 | 3
  factor: number | null
  /** Inicio del siguiente tramo, o null si ya está archivado. */
  proximoCambioAt: Date | null
}

export function tramoFreshness(verificadoAt: Date, ahora = new Date()): TramoFreshness {
  const edad = ahora.getTime() - verificadoAt.getTime()
  if (edad < 0 || edad >= VIDA_LEAD_MS) {
    return { tramo: 3, factor: null, proximoCambioAt: null }
  }
  if (edad < FRESH_24H_MS) {
    return {
      tramo: 0,
      factor: 1,
      proximoCambioAt: new Date(verificadoAt.getTime() + FRESH_24H_MS),
    }
  }
  if (edad < FRESH_72H_MS) {
    return {
      tramo: 1,
      factor: 0.8,
      proximoCambioAt: new Date(verificadoAt.getTime() + FRESH_72H_MS),
    }
  }
  return {
    tramo: 2,
    factor: 0.5,
    proximoCambioAt: new Date(verificadoAt.getTime() + VIDA_LEAD_MS),
  }
}

/** Resumen del paso de confirmación antes de descontar créditos (solo UX). */
export function resumenConfirmacionCompra(saldo: number, precio: number): {
  saldoDespues: number
  faltante: number
  alcanza: boolean
} {
  const faltante = Math.max(0, precio - saldo)
  return {
    saldoDespues: saldo - precio,
    faltante,
    alcanza: faltante === 0,
  }
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

/**
 * Antifraude: el mismo RUT de empresa no puede comprar el lead que cotizó.
 * Compara formas normalizadas; sin RUT válido en alguno de los lados, no bloquea.
 */
export function proveedorEsDuenioDelLead(
  rutProveedor: string | null | undefined,
  rutLeadContacto: string | null | undefined,
): boolean {
  const a = normalizarRut(rutProveedor)
  const b = normalizarRut(rutLeadContacto)
  if (!a || !b) return false
  return a === b
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
  /** RUT del proveedor (empresa). Si calza con el contacto del lead, se bloquea. */
  rutProveedor?: string | null
  rutLeadContacto?: string | null
}): { ok: true } | { ok: false; motivo: string } {
  const ahora = args.ahora ?? new Date()
  if (proveedorEsDuenioDelLead(args.rutProveedor, args.rutLeadContacto)) {
    return { ok: false, motivo: 'No puedes comprar un contacto de tu propia empresa.' }
  }
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
