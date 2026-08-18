'use server'

import { revalidatePath } from 'next/cache'
import {
  ActorTransicion,
  EstadoCompraLead,
  EstadoLead,
  EstadoProveedor,
  ModoRubro,
  TipoMovimientoCreditos,
  TipoTransicionLead,
} from '@prisma/client'

import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { avisarAdminLeadVerificado, avisarProveedoresLeadVerificado } from '@/server/avisos'
import { ajusteEmergenciaAdmin, saldoProveedor } from '@/server/creditos'
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
  revalidatePath(rutaAdmin('compradores'))
  revalidatePath(rutaAdmin(`leads/${lead.id}`))

  if (destino === EstadoLead.VERIFICADO && lead.estado !== EstadoLead.VERIFICADO) {
    await avisarProveedoresLeadVerificado(lead.id)
    await avisarAdminLeadVerificado(lead.id)
  }

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
    select: {
      id: true,
      estado: true,
      telefonoVerificado: true,
      rutValido: true,
      modoRubroAlCrear: true,
    },
  })

  if (!lead) return { ok: false, mensaje: 'No encontramos esa cotización.' }
  if (lead.telefonoVerificado) return { ok: true, mensaje: 'El teléfono ya estaba verificado.' }

  const pasaAVenta =
    lead.rutValido &&
    lead.modoRubroAlCrear === ModoRubro.VENTA &&
    (lead.estado === EstadoLead.RECIBIDO || lead.estado === EstadoLead.EN_REVISION)

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        telefonoVerificado: true,
        estado: pasaAVenta ? EstadoLead.VERIFICADO : lead.estado,
        verificadoAt: pasaAVenta ? new Date() : undefined,
      },
    }),
    prisma.transicionLead.create({
      data: {
        leadId: lead.id,
        tipo: TipoTransicionLead.TELEFONO_VERIFICADO,
        estadoDesde: lead.estado,
        estadoHasta: pasaAVenta ? EstadoLead.VERIFICADO : lead.estado,
        actor: ActorTransicion.ADMIN,
        actorUsuarioId: sesion.user.id,
        nota: 'Teléfono confirmado a mano por el admin (llamada).',
      },
    }),
    ...(pasaAVenta
      ? [
          prisma.transicionLead.create({
            data: {
              leadId: lead.id,
              tipo: TipoTransicionLead.VERIFICADO,
              estadoDesde: lead.estado,
              estadoHasta: EstadoLead.VERIFICADO,
              actor: ActorTransicion.SISTEMA,
              actorUsuarioId: sesion.user.id,
              nota: 'RUT válido y teléfono confirmado por el admin.',
            },
          }),
        ]
      : []),
  ])

  revalidatePath(rutaAdmin(`leads/${lead.id}`))
  revalidatePath(rutaAdmin('compradores'))

  if (pasaAVenta) {
    await avisarProveedoresLeadVerificado(lead.id)
    await avisarAdminLeadVerificado(lead.id)
  }

  return { ok: true, mensaje: 'Teléfono marcado como verificado.' }
}

const ACCIONES_PROVEEDOR = ['visto', 'aprobar', 'rechazar', 'suspender'] as const
type AccionProveedor = (typeof ACCIONES_PROVEEDOR)[number]

function esAccionProveedor(valor: string): valor is AccionProveedor {
  return (ACCIONES_PROVEEDOR as readonly string[]).includes(valor)
}

/**
 * Revisa cuentas de proveedor. Aprobar no carga créditos: el pack de
 * arranque lo acredita el OTP. El admin no es el cajero.
 */
export async function marcarListaEsperaProveedor(
  _estadoPrevio: ResultadoAccionAdmin,
  formData: FormData,
): Promise<ResultadoAccionAdmin> {
  await requerirAdmin()

  const proveedorId = String(formData.get('proveedorId') ?? '')
  const accionBruta = String(formData.get('accion') ?? '')
  if (!esAccionProveedor(accionBruta)) {
    return { ok: false, mensaje: 'Esa acción no existe.' }
  }

  const proveedor = await prisma.proveedor.findUnique({
    where: { id: proveedorId },
    select: { id: true },
  })
  if (!proveedor) {
    return { ok: false, mensaje: 'No encontramos esa cuenta.' }
  }

  if (accionBruta === 'visto') {
    await prisma.proveedor.update({
      where: { id: proveedor.id },
      data: { vistoAt: new Date() },
    })
  } else if (accionBruta === 'aprobar') {
    await prisma.proveedor.update({
      where: { id: proveedor.id },
      data: { estado: EstadoProveedor.APROBADO, vistoAt: new Date() },
    })
  } else if (accionBruta === 'suspender') {
    await prisma.proveedor.update({
      where: { id: proveedor.id },
      data: { estado: EstadoProveedor.SUSPENDIDO, vistoAt: new Date() },
    })
  } else {
    await prisma.proveedor.update({
      where: { id: proveedor.id },
      data: { estado: EstadoProveedor.RECHAZADO, vistoAt: new Date() },
    })
  }

  revalidatePath(rutaAdmin())
  revalidatePath(rutaAdmin('proveedores'))
  return { ok: true, mensaje: 'Proveedor actualizado.' }
}

export async function ajustarCreditosEmergencia(
  _estadoPrevio: ResultadoAccionAdmin,
  formData: FormData,
): Promise<ResultadoAccionAdmin> {
  await requerirAdmin()
  const proveedorId = String(formData.get('proveedorId') ?? '')
  const montoClp = Number.parseInt(String(formData.get('montoClp') ?? ''), 10)
  const descripcion = String(formData.get('descripcion') ?? '')
  if (!proveedorId) return { ok: false, mensaje: 'Falta el proveedor.' }
  const resultado = await ajusteEmergenciaAdmin({ proveedorId, montoClp, descripcion })
  revalidatePath(rutaAdmin('proveedores'))
  return resultado
}

export async function reversarCompraLead(
  _estadoPrevio: ResultadoAccionAdmin,
  formData: FormData,
): Promise<ResultadoAccionAdmin> {
  await requerirAdmin()
  const compraId = String(formData.get('compraId') ?? '')
  const compra = await prisma.compraLead.findUnique({
    where: { id: compraId },
    select: {
      id: true,
      estado: true,
      proveedorId: true,
      creditosConsumidos: true,
      leadId: true,
    },
  })
  if (!compra) return { ok: false, mensaje: 'No encontramos esa compra.' }
  if (compra.estado !== EstadoCompraLead.PAGADA) {
    return { ok: false, mensaje: 'Esa compra ya no está vigente.' }
  }

  const key = `reversa:${compra.id}`
  const ya = await prisma.movimientoCreditos.findUnique({
    where: { idempotencyKey: key },
    select: { id: true },
  })
  if (ya) return { ok: true, mensaje: 'Esa reversa ya estaba hecha.' }

  await prisma.$transaction(async (tx) => {
    await tx.compraLead.update({
      where: { id: compra.id },
      data: { estado: EstadoCompraLead.REVERSADA },
    })
    const saldo = await saldoProveedor(compra.proveedorId, tx)
    await tx.movimientoCreditos.create({
      data: {
        proveedorId: compra.proveedorId,
        tipo: TipoMovimientoCreditos.REVERSA,
        montoCreditos: compra.creditosConsumidos,
        saldoPosterior: saldo + compra.creditosConsumidos,
        compraLeadId: compra.id,
        idempotencyKey: key,
        descripcion: 'Reversa: datos falsos o teléfono que no contesta',
      },
    })
  })

  revalidatePath(rutaAdmin())
  revalidatePath(rutaAdmin('compradores'))
  revalidatePath(rutaAdmin(`leads/${compra.leadId}`))
  revalidatePath(rutaAdmin('proveedores'))
  return { ok: true, mensaje: 'Créditos devueltos. La compra quedó reversada.' }
}
