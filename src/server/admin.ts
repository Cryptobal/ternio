'use server'

import { revalidatePath } from 'next/cache'
import { ActorTransicion, EstadoLead, TipoTransicionLead } from '@prisma/client'

import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { requerirAdmin } from '@/server/sesion'

export type ResultadoAccionAdmin = { ok: boolean; mensaje: string }

/** Estados a los que el admin puede mover un lead a mano en Fase 0. */
const DESTINOS_PERMITIDOS = [
  EstadoLead.EN_REVISION,
  EstadoLead.VERIFICADO,
  EstadoLead.DESCARTADO,
  EstadoLead.ARCHIVADO,
] as const

type DestinoPermitido = (typeof DESTINOS_PERMITIDOS)[number]

function esDestinoPermitido(valor: string): valor is DestinoPermitido {
  return (DESTINOS_PERMITIDOS as readonly string[]).includes(valor)
}

/**
 * Mueve un lead de estado dejando el asiento en el historial.
 *
 * La regla dura se valida acá, no en la interfaz: un lead no llega a
 * VERIFICADO sin RUT válido y teléfono verificado, y un lead en lista de
 * espera (rubro en modo CAPTURA) no se mueve a VERIFICADO por ningún camino.
 */
export async function moverEstadoLead(
  _estadoPrevio: ResultadoAccionAdmin,
  formData: FormData,
): Promise<ResultadoAccionAdmin> {
  const sesion = await requerirAdmin()

  const leadId = String(formData.get('leadId') ?? '')
  const destinoBruto = String(formData.get('destino') ?? '')
  const nota = String(formData.get('nota') ?? '').trim()

  if (!esDestinoPermitido(destinoBruto)) {
    return { ok: false, mensaje: 'Ese estado no se puede aplicar a mano.' }
  }
  const destino: DestinoPermitido = destinoBruto

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      estado: true,
      rutValido: true,
      telefonoVerificado: true,
      modoRubroAlCrear: true,
    },
  })

  if (!lead) return { ok: false, mensaje: 'No encontramos esa cotización.' }

  if (destino === EstadoLead.VERIFICADO) {
    if (lead.estado === EstadoLead.LISTA_ESPERA) {
      return {
        ok: false,
        mensaje:
          'Esta cotización es de un rubro en modo captura: queda en lista de espera y no pasa a venta.',
      }
    }
    if (!lead.rutValido) {
      return { ok: false, mensaje: 'No se puede verificar: el RUT no está validado.' }
    }
    if (!lead.telefonoVerificado) {
      return {
        ok: false,
        mensaje:
          'No se puede verificar: falta confirmar el teléfono. Márcalo como verificado si lo confirmaste por llamada.',
      }
    }
  }

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        estado: destino,
        verificadoAt: destino === EstadoLead.VERIFICADO ? new Date() : undefined,
        archivadoAt: destino === EstadoLead.ARCHIVADO ? new Date() : undefined,
      },
    }),
    prisma.transicionLead.create({
      data: {
        leadId: lead.id,
        tipo:
          destino === EstadoLead.VERIFICADO
            ? TipoTransicionLead.VERIFICADO
            : destino === EstadoLead.DESCARTADO
              ? TipoTransicionLead.DESCARTADO
              : destino === EstadoLead.ARCHIVADO
                ? TipoTransicionLead.ARCHIVADO
                : TipoTransicionLead.ENVIADO_A_REVISION,
        estadoDesde: lead.estado,
        estadoHasta: destino,
        actor: ActorTransicion.ADMIN,
        actorUsuarioId: sesion.user.id,
        nota: nota || null,
      },
    }),
  ])

  revalidatePath(rutaAdmin())
  revalidatePath(rutaAdmin(`leads/${lead.id}`))

  return { ok: true, mensaje: 'Estado actualizado.' }
}

/**
 * Verificación manual del teléfono, para la Fase 0: el dueño llama al
 * comprador y confirma. Queda registrada con actor ADMIN en el historial, así
 * que se distingue siempre de la verificación por OTP que llega en Fase 2.
 */
export async function marcarTelefonoVerificado(
  _estadoPrevio: ResultadoAccionAdmin,
  formData: FormData,
): Promise<ResultadoAccionAdmin> {
  const sesion = await requerirAdmin()
  const leadId = String(formData.get('leadId') ?? '')

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, estado: true, telefonoVerificado: true },
  })

  if (!lead) return { ok: false, mensaje: 'No encontramos esa cotización.' }
  if (lead.telefonoVerificado) return { ok: true, mensaje: 'El teléfono ya estaba verificado.' }

  await prisma.$transaction([
    prisma.lead.update({ where: { id: lead.id }, data: { telefonoVerificado: true } }),
    prisma.transicionLead.create({
      data: {
        leadId: lead.id,
        tipo: TipoTransicionLead.TELEFONO_VERIFICADO,
        estadoDesde: lead.estado,
        estadoHasta: lead.estado,
        actor: ActorTransicion.ADMIN,
        actorUsuarioId: sesion.user.id,
        nota: 'Teléfono confirmado a mano por el admin (llamada).',
      },
    }),
  ])

  revalidatePath(rutaAdmin(`leads/${lead.id}`))

  return { ok: true, mensaje: 'Teléfono marcado como verificado.' }
}
