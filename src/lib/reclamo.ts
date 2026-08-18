import type { EstadoLead, PrismaClient } from '@prisma/client'
import { ActorTransicion, TipoTransicionLead } from '@prisma/client'

/**
 * Núcleo del reclamo de leads: asigna a una cuenta los leads creados en su
 * navegador antes de tener sesión, o los que coinciden con el teléfono
 * verificado al entrar de nuevo.
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

async function asignarLeads(
  prisma: PrismaClient,
  pendientes: { id: string; estado: EstadoLead; rubroId: string; comunaId: string }[],
  usuarioId: string,
  nota: string,
): Promise<LeadReclamado[]> {
  if (pendientes.length === 0) return []

  await prisma.$transaction([
    prisma.lead.updateMany({
      where: { id: { in: pendientes.map((lead) => lead.id) }, compradorUsuarioId: null },
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
        nota,
      })),
    }),
  ])

  return pendientes.map((lead) => ({
    id: lead.id,
    rubroId: lead.rubroId,
    comunaId: lead.comunaId,
  }))
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

  return asignarLeads(
    prisma,
    pendientes,
    usuarioId,
    'El comprador confirmó su teléfono y reclamó la cotización.',
  )
}

export async function reclamarLeadsPorTelefono(
  prisma: PrismaClient,
  telefonoE164: string,
  usuarioId: string,
): Promise<LeadReclamado[]> {
  const contactos = await prisma.leadContacto.findMany({
    where: { telefonoE164, lead: { compradorUsuarioId: null } },
    select: {
      lead: { select: { id: true, estado: true, rubroId: true, comunaId: true } },
    },
  })

  return asignarLeads(
    prisma,
    contactos.map((fila) => fila.lead),
    usuarioId,
    'El comprador entró con el mismo teléfono y retomó la cotización.',
  )
}
