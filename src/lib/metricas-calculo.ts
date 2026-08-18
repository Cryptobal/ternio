/**
 * Cálculos puros del embudo y go/no-go. Sin Prisma: los tests cubren esto
 * y `src/lib/metricas.ts` solo consulta y ensambla.
 */

export const SLA_AVISO_MS = 60_000
export const FRACTION_GO_NO_GO = 0.5

export type PasoEmbudo = {
  id: 'visitas' | 'inicios' | 'leads' | 'verificados' | 'vendidos'
  etiqueta: string
  conteo: number
  /** Conversión respecto al paso anterior; null en el primero o si el anterior es 0. */
  conversionDesdeAnterior: number | null
}

export type ResumenEmbudo = {
  pasos: PasoEmbudo[]
  cuentasCreadas: number
}

export type ResumenIngresos = {
  brutoClp: number
  reversasClp: number
  netoClp: number
  comprasPagadas: number
  comprasReversadas: number
  ticketPromedioClp: number | null
  creditosConsumidos: number
}

export type ResumenSla = {
  n: number
  p50Ms: number | null
  p95Ms: number | null
  sobreSla: number
  /** Semáforo por p95: verde < 60s, ámbar ≤ 120s, rojo > 120s. */
  semaforo: 'verde' | 'ambar' | 'rojo' | 'sin-datos'
}

export type EvaluacionGoNoGo = {
  inversionClp: number
  leadsVerificados: number
  costoPorLead: number | null
  umbralClp: number | null
  estado: 'verde' | 'rojo' | 'sin-datos'
}

/** Evita división por cero: tasa en [0, 1] o 0. */
export function tasa(numerador: number, denominador: number): number {
  if (denominador <= 0) return 0
  return numerador / denominador
}

/**
 * Percentil lineal. `p` en 0–100.
 * 0 muestras → null; 1 muestra → ese valor.
 */
export function percentil(valores: number[], p: number): number | null {
  if (valores.length === 0) return null
  if (valores.length === 1) return valores[0]!
  const ordenados = [...valores].sort((a, b) => a - b)
  const rango = Math.max(0, Math.min(100, p)) / 100
  const idx = (ordenados.length - 1) * rango
  const bajo = Math.floor(idx)
  const alto = Math.ceil(idx)
  if (bajo === alto) return ordenados[bajo]!
  const peso = idx - bajo
  return ordenados[bajo]! * (1 - peso) + ordenados[alto]! * peso
}

export function armarEmbudo(args: {
  visitas: number
  iniciosFormulario: number
  leadsCreados: number
  leadsVerificados: number
  leadsVendidos: number
  cuentasCreadas: number
}): ResumenEmbudo {
  const pasosBase: Array<Omit<PasoEmbudo, 'conversionDesdeAnterior'>> = [
    { id: 'visitas', etiqueta: 'Visitas', conteo: args.visitas },
    { id: 'inicios', etiqueta: 'Inicios de formulario', conteo: args.iniciosFormulario },
    { id: 'leads', etiqueta: 'Leads creados', conteo: args.leadsCreados },
    { id: 'verificados', etiqueta: 'Leads verificados', conteo: args.leadsVerificados },
    { id: 'vendidos', etiqueta: 'Leads vendidos', conteo: args.leadsVendidos },
  ]

  const pasos: PasoEmbudo[] = pasosBase.map((paso, i) => {
    if (i === 0) return { ...paso, conversionDesdeAnterior: null }
    const anterior = pasosBase[i - 1]!.conteo
    return {
      ...paso,
      conversionDesdeAnterior: anterior > 0 ? tasa(paso.conteo, anterior) : null,
    }
  })

  return { pasos, cuentasCreadas: args.cuentasCreadas }
}

export function calcularIngresos(args: {
  preciosPagados: number[]
  preciosReversados: number[]
}): ResumenIngresos {
  const brutoClp = args.preciosPagados.reduce((acc, n) => acc + n, 0)
  const reversasClp = args.preciosReversados.reduce((acc, n) => acc + n, 0)
  const netoClp = brutoClp - reversasClp
  const comprasPagadas = args.preciosPagados.length
  return {
    brutoClp,
    reversasClp,
    netoClp,
    comprasPagadas,
    comprasReversadas: args.preciosReversados.length,
    ticketPromedioClp: comprasPagadas > 0 ? Math.round(brutoClp / comprasPagadas) : null,
    creditosConsumidos: brutoClp,
  }
}

/** Un lead con N compras PAGADAS cuenta 1 vez como vendido. */
export function contarLeadsVendidos(leadIds: string[]): number {
  return new Set(leadIds).size
}

/**
 * Solo muestras con al menos un proveedor avisado entran al percentil.
 * `proveedoresAvisados: 0` no cuenta como SLA incumplido.
 */
export function resumenSla(
  muestras: Array<{ msDesdeVerificado: number; proveedoresAvisados: number }>,
  slaMs: number = SLA_AVISO_MS,
): ResumenSla {
  const conAviso = muestras.filter((m) => m.proveedoresAvisados > 0)
  const tiempos = conAviso.map((m) => m.msDesdeVerificado)
  const p50Ms = percentil(tiempos, 50)
  const p95Ms = percentil(tiempos, 95)
  const sobreSla = tiempos.filter((ms) => ms > slaMs).length

  let semaforo: ResumenSla['semaforo'] = 'sin-datos'
  if (p95Ms !== null) {
    if (p95Ms < slaMs) semaforo = 'verde'
    else if (p95Ms <= slaMs * 2) semaforo = 'ambar'
    else semaforo = 'rojo'
  }

  return { n: tiempos.length, p50Ms, p95Ms, sobreSla, semaforo }
}

export function evaluarGoNoGo(args: {
  inversionClp: number
  leadsVerificados: number
  /** Precio de venta de referencia (p. ej. exclusivo promedio). */
  precioVentaRefClp: number | null
}): EvaluacionGoNoGo {
  const umbralClp =
    args.precioVentaRefClp !== null && args.precioVentaRefClp > 0
      ? Math.round(args.precioVentaRefClp * FRACTION_GO_NO_GO)
      : null
  const costoPorLead =
    args.leadsVerificados > 0 && args.inversionClp >= 0
      ? Math.round(args.inversionClp / args.leadsVerificados)
      : null

  let estado: EvaluacionGoNoGo['estado'] = 'sin-datos'
  if (costoPorLead !== null && umbralClp !== null) {
    estado = costoPorLead < umbralClp ? 'verde' : 'rojo'
  }

  return {
    inversionClp: args.inversionClp,
    leadsVerificados: args.leadsVerificados,
    costoPorLead,
    umbralClp,
    estado,
  }
}

export type RangoEmbudo = '7d' | '30d' | '90d' | 'todo'

export const RANGOS_EMBUDO: Array<{ id: RangoEmbudo; etiqueta: string; dias: number | null }> = [
  { id: '7d', etiqueta: '7 días', dias: 7 },
  { id: '30d', etiqueta: '30 días', dias: 30 },
  { id: '90d', etiqueta: '90 días', dias: 90 },
  /** "Todo" se acota a 12 meses para no colgar la función serverless. */
  { id: 'todo', etiqueta: '12 meses', dias: 365 },
]

export function desdePorRango(rango: RangoEmbudo, ahora: Date = new Date()): Date {
  const def = RANGOS_EMBUDO.find((r) => r.id === rango) ?? RANGOS_EMBUDO[1]!
  const dias = def.dias ?? 365
  return new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000)
}

export function parsearRango(bruto: string | null | undefined): RangoEmbudo {
  if (bruto === '7d' || bruto === '90d' || bruto === 'todo') return bruto
  return '30d'
}

export function claveInversionAds(rango: RangoEmbudo): string {
  return `ads:inversion:${rango}`
}

export function parsearInversionClp(valor: string | null | undefined): number {
  if (!valor) return 0
  const n = Number.parseInt(valor.replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}
