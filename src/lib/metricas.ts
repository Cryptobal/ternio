import 'server-only'

import {
  EstadoCompraLead,
  EstadoLead,
  TipoEventoAnalitica,
  TipoMovimientoCreditos,
} from '@prisma/client'

import {
  armarEmbudo,
  calcularIngresos,
  claveInversionAds,
  contarLeadsVendidos,
  desdePorRango,
  evaluarGoNoGo,
  parsearInversionClp,
  resumenSla,
  tasa,
  type RangoEmbudo,
  type ResumenEmbudo,
  type ResumenIngresos,
  type ResumenSla,
  type EvaluacionGoNoGo,
} from '@/lib/metricas-calculo'
import { prisma } from '@/lib/prisma'

export type {
  EvaluacionGoNoGo,
  PasoEmbudo,
  RangoEmbudo,
  ResumenEmbudo,
  ResumenIngresos,
  ResumenSla,
} from '@/lib/metricas-calculo'

export {
  RANGOS_EMBUDO,
  SLA_AVISO_MS,
  desdePorRango,
  parsearRango,
  claveInversionAds,
  parsearInversionClp,
  percentil,
  tasa,
  armarEmbudo,
  calcularIngresos,
  contarLeadsVendidos,
  resumenSla,
  evaluarGoNoGo,
} from '@/lib/metricas-calculo'

export type FilaCorte = {
  clave: string
  rubroId: string
  rubroSlug: string
  rubroNombre: string
  comunaId: string | null
  comunaSlug: string | null
  comunaNombre: string | null
  visitas: number
  inicios: number
  leads: number
  verificados: number
  vendidos: number
  ingresosClp: number
  conversionVisitaLead: number
}

export type TableroEmbudo = {
  rango: RangoEmbudo
  desde: Date
  /** Visitas = pageviews (cada VISITA_PAGINA). sesionAnonId vive en localStorage. */
  unidadVisitas: 'pageviews'
  embudo: ResumenEmbudo
  porPagina: FilaCorte[]
  porRubro: FilaCorte[]
  ingresos: ResumenIngresos
  sla: ResumenSla
  goNoGo: EvaluacionGoNoGo
  inversionClp: number
  precioVentaRefClp: number | null
}

function conteoTipo(
  filas: Array<{ tipo: TipoEventoAnalitica; _count: { _all: number } }>,
  tipo: TipoEventoAnalitica,
): number {
  return filas.find((fila) => fila.tipo === tipo)?._count._all ?? 0
}

/** Embudo agregado del rango (pageviews → … → vendidos). */
export async function embudoCompleto(desde: Date): Promise<ResumenEmbudo> {
  const [eventos, verificados, compras] = await Promise.all([
    prisma.eventoAnalitica.groupBy({
      by: ['tipo'],
      where: { createdAt: { gte: desde } },
      _count: { _all: true },
    }),
    prisma.lead.count({
      where: { verificadoAt: { gte: desde } },
    }),
    prisma.compraLead.findMany({
      where: { estado: EstadoCompraLead.PAGADA, createdAt: { gte: desde } },
      select: { leadId: true },
    }),
  ])

  return armarEmbudo({
    visitas: conteoTipo(eventos, TipoEventoAnalitica.VISITA_PAGINA),
    iniciosFormulario: conteoTipo(eventos, TipoEventoAnalitica.FORM_START),
    leadsCreados: conteoTipo(eventos, TipoEventoAnalitica.LEAD_CREADO),
    leadsVerificados: verificados,
    leadsVendidos: contarLeadsVendidos(compras.map((c) => c.leadId)),
    cuentasCreadas: conteoTipo(eventos, TipoEventoAnalitica.CUENTA_CREADA),
  })
}

/** @deprecated Preferir embudoCompleto; se conserva por compatibilidad. */
export async function embudo(desde: Date) {
  const resumen = await embudoCompleto(desde)
  const visitas = resumen.pasos.find((p) => p.id === 'visitas')?.conteo ?? 0
  const inicios = resumen.pasos.find((p) => p.id === 'inicios')?.conteo ?? 0
  const leads = resumen.pasos.find((p) => p.id === 'leads')?.conteo ?? 0
  return {
    visitas,
    iniciosFormulario: inicios,
    leadsCreados: leads,
    cuentasCreadas: resumen.cuentasCreadas,
    conversionVisitaLead: tasa(leads, visitas),
    conversionLeadCuenta: tasa(resumen.cuentasCreadas, leads),
  }
}

export async function leadsPorEstado(desde: Date): Promise<Record<EstadoLead, number>> {
  const filas = await prisma.lead.groupBy({
    by: ['estado'],
    where: { createdAt: { gte: desde } },
    _count: { _all: true },
  })

  const base = Object.fromEntries(
    Object.values(EstadoLead).map((estado) => [estado, 0]),
  ) as Record<EstadoLead, number>

  for (const fila of filas) base[fila.estado] = fila._count._all
  return base
}

async function catalogoRubrosComunas() {
  const [rubros, comunas] = await Promise.all([
    prisma.rubro.findMany({
      where: { activo: true },
      select: { id: true, slug: true, nombre: true, precioExclusivoClp: true },
    }),
    prisma.comuna.findMany({
      where: { activa: true },
      select: { id: true, slug: true, nombre: true },
    }),
  ])
  return {
    rubros,
    comunas,
    rubroPorId: new Map(rubros.map((r) => [r.id, r])),
    comunaPorId: new Map(comunas.map((c) => [c.id, c])),
  }
}

type Acum = {
  visitas: number
  inicios: number
  leads: number
  verificados: number
  vendidos: Set<string>
  ingresosClp: number
}

function vacio(): Acum {
  return { visitas: 0, inicios: 0, leads: 0, verificados: 0, vendidos: new Set(), ingresosClp: 0 }
}

export async function cortesPorPaginaYRubro(desde: Date): Promise<{
  porPagina: FilaCorte[]
  porRubro: FilaCorte[]
}> {
  const { rubroPorId, comunaPorId } = await catalogoRubrosComunas()

  const [eventos, verificados, compras] = await Promise.all([
    prisma.eventoAnalitica.groupBy({
      by: ['tipo', 'rubroId', 'comunaId'],
      where: {
        createdAt: { gte: desde },
        tipo: {
          in: [
            TipoEventoAnalitica.VISITA_PAGINA,
            TipoEventoAnalitica.FORM_START,
            TipoEventoAnalitica.LEAD_CREADO,
          ],
        },
        rubroId: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ['rubroId', 'comunaId'],
      where: { verificadoAt: { gte: desde } },
      _count: { _all: true },
    }),
    prisma.compraLead.findMany({
      where: { estado: EstadoCompraLead.PAGADA, createdAt: { gte: desde } },
      select: {
        leadId: true,
        precioClp: true,
        lead: { select: { rubroId: true, comunaId: true } },
      },
    }),
  ])

  const porPaginaMap = new Map<string, Acum>()
  const porRubroMap = new Map<string, Acum>()

  const clavePagina = (rubroId: string, comunaId: string | null) => `${rubroId}|${comunaId ?? ''}`

  function asegurar(map: Map<string, Acum>, clave: string): Acum {
    let fila = map.get(clave)
    if (!fila) {
      fila = vacio()
      map.set(clave, fila)
    }
    return fila
  }

  for (const fila of eventos) {
    if (!fila.rubroId) continue
    const n = fila._count._all
    const acumP = asegurar(porPaginaMap, clavePagina(fila.rubroId, fila.comunaId))
    const acumR = asegurar(porRubroMap, fila.rubroId)
    if (fila.tipo === TipoEventoAnalitica.VISITA_PAGINA) {
      acumP.visitas += n
      acumR.visitas += n
    } else if (fila.tipo === TipoEventoAnalitica.FORM_START) {
      acumP.inicios += n
      acumR.inicios += n
    } else if (fila.tipo === TipoEventoAnalitica.LEAD_CREADO) {
      acumP.leads += n
      acumR.leads += n
    }
  }

  for (const fila of verificados) {
    const acumP = asegurar(porPaginaMap, clavePagina(fila.rubroId, fila.comunaId))
    const acumR = asegurar(porRubroMap, fila.rubroId)
    acumP.verificados += fila._count._all
    acumR.verificados += fila._count._all
  }

  for (const compra of compras) {
    const { rubroId, comunaId } = compra.lead
    const acumP = asegurar(porPaginaMap, clavePagina(rubroId, comunaId))
    const acumR = asegurar(porRubroMap, rubroId)
    acumP.vendidos.add(compra.leadId)
    acumR.vendidos.add(compra.leadId)
    acumP.ingresosClp += compra.precioClp
    acumR.ingresosClp += compra.precioClp
  }

  function aFilaPagina(clave: string, acum: Acum): FilaCorte | null {
    const [rubroId, comunaIdRaw] = clave.split('|')
    if (!rubroId) return null
    const rubro = rubroPorId.get(rubroId)
    if (!rubro) return null
    const comunaId = comunaIdRaw || null
    const comuna = comunaId ? comunaPorId.get(comunaId) : null
    return {
      clave,
      rubroId,
      rubroSlug: rubro.slug,
      rubroNombre: rubro.nombre,
      comunaId,
      comunaSlug: comuna?.slug ?? null,
      comunaNombre: comuna?.nombre ?? null,
      visitas: acum.visitas,
      inicios: acum.inicios,
      leads: acum.leads,
      verificados: acum.verificados,
      vendidos: acum.vendidos.size,
      ingresosClp: acum.ingresosClp,
      conversionVisitaLead: tasa(acum.leads, acum.visitas),
    }
  }

  function aFilaRubro(rubroId: string, acum: Acum): FilaCorte | null {
    const rubro = rubroPorId.get(rubroId)
    if (!rubro) return null
    return {
      clave: rubroId,
      rubroId,
      rubroSlug: rubro.slug,
      rubroNombre: rubro.nombre,
      comunaId: null,
      comunaSlug: null,
      comunaNombre: null,
      visitas: acum.visitas,
      inicios: acum.inicios,
      leads: acum.leads,
      verificados: acum.verificados,
      vendidos: acum.vendidos.size,
      ingresosClp: acum.ingresosClp,
      conversionVisitaLead: tasa(acum.leads, acum.visitas),
    }
  }

  const porPagina = [...porPaginaMap.entries()]
    .map(([clave, acum]) => aFilaPagina(clave, acum))
    .filter((f): f is FilaCorte => f !== null)
    .sort((a, b) => b.ingresosClp - a.ingresosClp || b.visitas - a.visitas)

  const porRubro = [...porRubroMap.entries()]
    .map(([id, acum]) => aFilaRubro(id, acum))
    .filter((f): f is FilaCorte => f !== null)
    .sort((a, b) => b.ingresosClp - a.ingresosClp || b.visitas - a.visitas)

  return { porPagina, porRubro }
}

export async function ingresosDelRango(desde: Date): Promise<ResumenIngresos> {
  const [pagadas, reversadas] = await Promise.all([
    prisma.compraLead.findMany({
      where: { estado: EstadoCompraLead.PAGADA, createdAt: { gte: desde } },
      select: { precioClp: true },
    }),
    prisma.compraLead.findMany({
      where: { estado: EstadoCompraLead.REVERSADA, updatedAt: { gte: desde } },
      select: { precioClp: true },
    }),
  ])

  // Creditos consumidos del ledger (CONSUMo absoluto) para el bloque dinero.
  const consumos = await prisma.movimientoCreditos.aggregate({
    where: {
      tipo: TipoMovimientoCreditos.CONSUMO_LEAD,
      createdAt: { gte: desde },
    },
    _sum: { montoCreditos: true },
  })

  const base = calcularIngresos({
    preciosPagados: pagadas.map((c) => c.precioClp),
    preciosReversados: reversadas.map((c) => c.precioClp),
  })

  return {
    ...base,
    creditosConsumidos: Math.abs(consumos._sum.montoCreditos ?? 0),
  }
}

export async function slaDelRango(desde: Date): Promise<ResumenSla> {
  const eventos = await prisma.eventoAnalitica.findMany({
    where: {
      tipo: TipoEventoAnalitica.LEAD_AVISADO,
      createdAt: { gte: desde },
    },
    select: { metadata: true },
    take: 5_000,
  })

  const muestras: Array<{ msDesdeVerificado: number; proveedoresAvisados: number }> = []
  for (const ev of eventos) {
    const meta = ev.metadata
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) continue
    const obj = meta as Record<string, unknown>
    const ms = typeof obj.msDesdeVerificado === 'number' ? obj.msDesdeVerificado : null
    const n = typeof obj.proveedoresAvisados === 'number' ? obj.proveedoresAvisados : null
    if (ms === null || n === null || !Number.isFinite(ms) || !Number.isFinite(n)) continue
    muestras.push({ msDesdeVerificado: ms, proveedoresAvisados: n })
  }

  return resumenSla(muestras)
}

export async function leerInversionAds(rango: RangoEmbudo): Promise<number> {
  const fila = await prisma.parametroAdmin.findUnique({
    where: { clave: claveInversionAds(rango) },
    select: { valor: true },
  })
  return parsearInversionClp(fila?.valor)
}

export async function precioVentaReferencia(): Promise<number | null> {
  const rubros = await prisma.rubro.findMany({
    where: { activo: true, precioExclusivoClp: { not: null, gt: 0 } },
    select: { precioExclusivoClp: true },
  })
  if (rubros.length === 0) return null
  const suma = rubros.reduce((acc, r) => acc + (r.precioExclusivoClp ?? 0), 0)
  return Math.round(suma / rubros.length)
}

export async function cargarTableroEmbudo(
  rango: RangoEmbudo,
  ahora: Date = new Date(),
): Promise<TableroEmbudo> {
  const desde = desdePorRango(rango, ahora)

  const [embudoResumen, cortes, ingresos, sla, inversionClp, precioVentaRefClp] =
    await Promise.all([
      embudoCompleto(desde),
      cortesPorPaginaYRubro(desde),
      ingresosDelRango(desde),
      slaDelRango(desde),
      leerInversionAds(rango),
      precioVentaReferencia(),
    ])

  const verificados =
    embudoResumen.pasos.find((p) => p.id === 'verificados')?.conteo ?? 0

  return {
    rango,
    desde,
    unidadVisitas: 'pageviews',
    embudo: embudoResumen,
    porPagina: cortes.porPagina,
    porRubro: cortes.porRubro,
    ingresos,
    sla,
    inversionClp,
    precioVentaRefClp,
    goNoGo: evaluarGoNoGo({
      inversionClp,
      leadsVerificados: verificados,
      precioVentaRefClp,
    }),
  }
}
