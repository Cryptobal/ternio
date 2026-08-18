import 'server-only'

import {
  EstadoProveedor,
  Prisma,
  TipoMovimientoCreditos,
} from '@prisma/client'

import {
  asientoAlta,
  CREDITOS_SEMILLA_GARD,
  claveAsientoAlta,
  claveSemillaGard,
  debeCrearAsientoAlta,
  saldoDesdeMovimientos,
} from '@/lib/creditos'
import { esRutValido } from '@/lib/rut'
import { prisma } from '@/lib/prisma'

export async function saldoProveedor(proveedorId: string, tx: Prisma.TransactionClient | typeof prisma = prisma): Promise<number> {
  const filas = await tx.movimientoCreditos.findMany({
    where: { proveedorId },
    select: { montoCreditos: true, idempotencyKey: true },
    orderBy: { createdAt: 'asc' },
  })
  return saldoDesdeMovimientos(filas.map((fila) => fila.montoCreditos))
}

export async function keysAsientos(proveedorId: string): Promise<(string | null)[]> {
  const filas = await prisma.movimientoCreditos.findMany({
    where: { proveedorId },
    select: { idempotencyKey: true },
  })
  return filas.map((fila) => fila.idempotencyKey)
}

/**
 * Acredita el pack de arranque. Idempotente: `alta:{proveedorId}`.
 * No cambia el estado; eso lo hace `activarProveedorTrasOtp`.
 */
export async function acreditarAltaProveedor(proveedorId: string): Promise<{ creado: boolean; saldo: number }> {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.movimientoCreditos.findUnique({
      where: { idempotencyKey: claveAsientoAlta(proveedorId) },
      select: { id: true },
    })
    const keys = existente ? [claveAsientoAlta(proveedorId)] : []
    if (!debeCrearAsientoAlta(keys) || existente) {
      return { creado: false, saldo: await saldoProveedor(proveedorId, tx) }
    }

    const saldoActual = await saldoProveedor(proveedorId, tx)
    const asiento = asientoAlta({ proveedorId, saldoActual })
    await tx.movimientoCreditos.create({
      data: {
        proveedorId,
        tipo: TipoMovimientoCreditos.AJUSTE,
        montoCreditos: asiento.montoCreditos,
        saldoPosterior: asiento.saldoPosterior,
        idempotencyKey: asiento.idempotencyKey,
        descripcion: asiento.descripcion,
      },
    })
    return { creado: true, saldo: asiento.saldoPosterior }
  })
}

export type ResultadoAltaProveedor = {
  proveedorId: string | null
  recienAprobado: boolean
}

/**
 * Tras OTP (o si el celular ya estaba confirmado): APROBADO + pack de arranque
 * si el RUT es válido. No des-suspende ni des-rechaza.
 * `recienAprobado` es true solo al pasar a APROBADO (no en cada login).
 */
export async function activarProveedorTrasOtp(usuarioId: string): Promise<ResultadoAltaProveedor> {
  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId },
    select: {
      id: true,
      estado: true,
      rutNormalizado: true,
    },
  })
  if (!proveedor) return { proveedorId: null, recienAprobado: false }
  if (proveedor.estado === EstadoProveedor.SUSPENDIDO || proveedor.estado === EstadoProveedor.RECHAZADO) {
    return { proveedorId: proveedor.id, recienAprobado: false }
  }
  if (!esRutValido(proveedor.rutNormalizado)) {
    return { proveedorId: proveedor.id, recienAprobado: false }
  }

  const recienAprobado = proveedor.estado !== EstadoProveedor.APROBADO
  if (recienAprobado) {
    await prisma.proveedor.update({
      where: { id: proveedor.id },
      data: { estado: EstadoProveedor.APROBADO, vistoAt: new Date() },
    })
  }
  await acreditarAltaProveedor(proveedor.id)
  return { proveedorId: proveedor.id, recienAprobado }
}

export async function acreditarSemillaGardSiSaldoCero(proveedorId: string): Promise<void> {
  const key = claveSemillaGard(proveedorId)
  const ya = await prisma.movimientoCreditos.findUnique({
    where: { idempotencyKey: key },
    select: { id: true },
  })
  if (ya) return

  await prisma.$transaction(async (tx) => {
    const saldo = await saldoProveedor(proveedorId, tx)
    if (saldo !== 0) return
    const otraVez = await tx.movimientoCreditos.findUnique({
      where: { idempotencyKey: key },
      select: { id: true },
    })
    if (otraVez) return
    await tx.movimientoCreditos.create({
      data: {
        proveedorId,
        tipo: TipoMovimientoCreditos.AJUSTE,
        montoCreditos: CREDITOS_SEMILLA_GARD,
        saldoPosterior: CREDITOS_SEMILLA_GARD,
        idempotencyKey: key,
        descripcion: 'Semilla Gard Security (saldo en cero)',
      },
    })
  })
}

export async function ajusteEmergenciaAdmin(args: {
  proveedorId: string
  montoClp: number
  descripcion: string
}): Promise<{ ok: boolean; mensaje: string }> {
  if (!Number.isInteger(args.montoClp) || args.montoClp === 0) {
    return { ok: false, mensaje: 'El monto tiene que ser un número distinto de cero.' }
  }
  if (Math.abs(args.montoClp) > 20_000_000) {
    return { ok: false, mensaje: 'Ese monto no es razonable.' }
  }
  const nota = args.descripcion.trim() || 'Ajuste de emergencia'
  await prisma.$transaction(async (tx) => {
    const saldo = await saldoProveedor(args.proveedorId, tx)
    await tx.movimientoCreditos.create({
      data: {
        proveedorId: args.proveedorId,
        tipo: TipoMovimientoCreditos.AJUSTE,
        montoCreditos: args.montoClp,
        saldoPosterior: saldo + args.montoClp,
        descripcion: nota,
      },
    })
  })
  return { ok: true, mensaje: 'Ajuste registrado.' }
}
