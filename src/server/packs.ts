'use server'

import { randomBytes } from 'node:crypto'
import { TipoMovimientoCreditos } from '@prisma/client'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { packPorId } from '@/lib/creditos'
import { comercioOrderPack, decisionAcreditarFlow, flowConfigurado } from '@/lib/flow'
import { prisma } from '@/lib/prisma'
import { ROLES } from '@/lib/roles'
import { esCorreoValido } from '@/lib/validar-identidad'
import { crearPagoFlow, estadoPagoFlow } from '@/server/flow-cliente'
import { saldoProveedor } from '@/server/creditos'
import { sesionParaPanel } from '@/server/sesion'

export type EstadoPack = { ok: boolean; mensaje: string }

async function urlPublicaApp(): Promise<string> {
  const cabeceras = await headers()
  const host = cabeceras.get('x-forwarded-host') ?? cabeceras.get('host')
  if (host) {
    const proto = cabeceras.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${host}`
  }
  return (process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl').replace(/\/+$/, '')
}

export async function iniciarPackAction(
  _previo: EstadoPack,
  formData: FormData,
): Promise<EstadoPack> {
  const sesion = await sesionParaPanel()
  if (sesion?.user.rol !== ROLES.PROVEEDOR || !sesion.user.id) {
    return { ok: false, mensaje: 'Entra con tu cuenta de proveedor.' }
  }

  const pack = packPorId(String(formData.get('packId') ?? ''))
  if (!pack) {
    return { ok: false, mensaje: 'Pack inválido.' }
  }
  if (!flowConfigurado()) {
    return {
      ok: false,
      mensaje: 'Flow no está configurado. Faltan FLOW_API_KEY y FLOW_SECRET_KEY.',
    }
  }

  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId: sesion.user.id },
    select: {
      id: true,
      estado: true,
      email: true,
      usuario: { select: { email: true } },
    },
  })
  if (!proveedor || proveedor.estado !== 'APROBADO') {
    return { ok: false, mensaje: 'Tu cuenta aún no puede recargar.' }
  }

  const email = (proveedor.email ?? proveedor.usuario?.email ?? '').trim().toLowerCase()
  if (!esCorreoValido(email)) {
    return { ok: false, mensaje: 'Necesitamos el correo de la empresa para pagar con Flow.' }
  }

  const commerceOrder = comercioOrderPack(proveedor.id, pack.id, randomBytes(8).toString('hex'))
  const base = await urlPublicaApp()

  let creado: { url: string }
  try {
    creado = await crearPagoFlow({
      commerceOrder,
      subject: `Ternio — ${pack.etiqueta}`,
      amount: pack.montoClp,
      email,
      urlConfirmation: `${base}/api/flow/confirmacion`,
      urlReturn: `${base}/api/flow/retorno`,
    })
  } catch (error) {
    return {
      ok: false,
      mensaje: error instanceof Error ? error.message : 'Flow no pudo crear el pago.',
    }
  }

  redirect(creado.url)
}

export async function acreditarPackSiPagado(token: string): Promise<
  | { ok: true; duplicado: boolean }
  | { ok: false; pendiente: true; status: number }
  | { ok: false; error: string; reintentar?: boolean }
> {
  let pago: Awaited<ReturnType<typeof estadoPagoFlow>>
  try {
    pago = await estadoPagoFlow(token)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Flow no entregó el estado del pago.',
      reintentar: true,
    }
  }

  const decision = decisionAcreditarFlow(pago)
  if (!decision.ok) {
    if (decision.motivo === 'pendiente') {
      return { ok: false, pendiente: true, status: pago.status }
    }
    if (decision.motivo === 'rechazado') {
      return { ok: false, error: 'El pago no está confirmado por Flow.' }
    }
    if (decision.motivo === 'orden') {
      return { ok: false, error: 'commerceOrder de Flow no corresponde a un pack Ternio.' }
    }
    return { ok: false, error: 'El monto de Flow no calza con el pack.' }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existente = await tx.movimientoCreditos.findUnique({
        where: { idempotencyKey: decision.idempotencyKey },
        select: { id: true },
      })
      if (existente) {
        return { ok: true as const, duplicado: true }
      }

      const proveedor = await tx.proveedor.findUnique({
        where: { id: decision.proveedorId },
        select: { id: true },
      })
      if (!proveedor) {
        return { ok: false as const, error: 'Proveedor no encontrado.' }
      }

      const saldoActual = await saldoProveedor(decision.proveedorId, tx)
      await tx.movimientoCreditos.create({
        data: {
          proveedorId: decision.proveedorId,
          tipo: TipoMovimientoCreditos.COMPRA_PACK,
          montoCreditos: decision.montoClp,
          saldoPosterior: saldoActual + decision.montoClp,
          idempotencyKey: decision.idempotencyKey,
          descripcion: `Pack Flow ${decision.packId} · ${pago.commerceOrder}`,
        },
      })
      return { ok: true as const, duplicado: false }
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { ok: true, duplicado: true }
    }
    throw error
  }
}
