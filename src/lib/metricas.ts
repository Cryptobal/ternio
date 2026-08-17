import 'server-only'

import { EstadoLead, TipoEventoAnalitica } from '@prisma/client'

import { prisma } from '@/lib/prisma'

/**
 * Embudo de Fase 0 y criterio go/no-go.
 *
 * VISITA_PAGINA → FORM_START → LEAD_CREADO → CUENTA_CREADA.
 * Los dos primeros pasos se cuentan por navegador anónimo; los dos últimos,
 * por hecho real ocurrido en el servidor.
 */

export type Embudo = {
  visitas: number
  iniciosFormulario: number
  leadsCreados: number
  cuentasCreadas: number
  conversionVisitaLead: number
  conversionLeadCuenta: number
}

export async function embudo(desde: Date): Promise<Embudo> {
  const filas = await prisma.eventoAnalitica.groupBy({
    by: ['tipo'],
    where: { createdAt: { gte: desde } },
    _count: { _all: true },
  })

  const conteo = (tipo: TipoEventoAnalitica): number =>
    filas.find((fila) => fila.tipo === tipo)?._count._all ?? 0

  const visitas = conteo(TipoEventoAnalitica.VISITA_PAGINA)
  const leadsCreados = conteo(TipoEventoAnalitica.LEAD_CREADO)
  const cuentasCreadas = conteo(TipoEventoAnalitica.CUENTA_CREADA)

  return {
    visitas,
    iniciosFormulario: conteo(TipoEventoAnalitica.FORM_START),
    leadsCreados,
    cuentasCreadas,
    conversionVisitaLead: visitas > 0 ? leadsCreados / visitas : 0,
    conversionLeadCuenta: leadsCreados > 0 ? cuentasCreadas / leadsCreados : 0,
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
