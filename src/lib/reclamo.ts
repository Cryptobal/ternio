import type { PrismaClient } from '@prisma/client'
import { ActorTransicion, TipoTransicionLead } from '@prisma/client'

/**
 * Núcleo del reclamo de leads: asigna a una cuenta los leads creados en su
 * navegador antes de tener cuenta.
 *
 * Vive separado de la server action para poder probarlo contra una base de
 * datos real sin necesitar una request. La action se encarga de la cookie, la
 * sesión y la analítica.
 *
 * Idempotente por construcción: el filtro `compradorUsuarioId: null` hace que
 * una segunda corrida no encuentre nada que reclamar.
 */

export type LeadReclamado = {
  id: string
  rubroId: string
  comunaId: string
}

export async function reclamarLeadsPorHash(
  prisma: PrismaClient,
  claimTokenHash: string,
  usuarioId: string,
): Promise<LeadReclamado[]> {
  const pendientes = await prisma.lead.findMany({
    where: { claimTokenHash, compradorUsuarioId: null },
    select: { id: true, estado: true, rubroId: true, comunaId: true },
  })

  if (pendientes.length === 0) return []

  await prisma.$transaction([
    prisma.lead.updateMany({
      where: { claimTokenHash, compradorUsuarioId: null },
      data: { compradorUsuarioId: usuarioId },
    }),
    prisma.transicionLead.createMany({
      data: pendientes.map((lead) => ({
        leadId: lead.id,
        tipo: TipoTransicionLead.CUENTA_VINCULADA,
        estadoDesde: lead.estado,
        estadoHasta: lead.estado,
        actor: ActorTransicion.COMPRADOR,
        actorUsuarioId: usuarioId,
        nota: 'El comprador creó su cuenta y reclamó la cotización.',
      })),
    }),
  ])

  return pendientes.map((lead) => ({
    id: lead.id,
    rubroId: lead.rubroId,
    comunaId: lead.comunaId,
  }))
}
