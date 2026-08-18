'use server'

import { revalidatePath } from 'next/cache'

import { parsearAudienciasEntrada } from '@/lib/audiencia'
import { leerSnapshotCobertura } from '@/lib/cobertura'
import { prisma } from '@/lib/prisma'
import { requerirProveedor } from '@/server/sesion'
import { Prisma } from '@prisma/client'

export type ResultadoAudienciasPanel = { ok: boolean; mensaje: string }

/**
 * Actualiza audiencias por rubro: snapshot + todas las filas Cobertura de ese rubro.
 * Solo el proveedor dueño de la sesión.
 */
export async function actualizarAudienciasCoberturaAction(
  _previo: ResultadoAudienciasPanel,
  formData: FormData,
): Promise<ResultadoAudienciasPanel> {
  const sesion = await requerirProveedor()
  const rubroSlug = String(formData.get('rubroSlug') ?? '').trim()
  if (!rubroSlug) return { ok: false, mensaje: 'Falta el rubro.' }

  const parseo = parsearAudienciasEntrada(formData.getAll('audiencias'))
  if (!parseo.ok) return { ok: false, mensaje: parseo.motivo }

  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId: sesion.user.id },
    select: { id: true, solicitudEspera: true },
  })
  if (!proveedor) return { ok: false, mensaje: 'No encontramos tu cuenta.' }

  const rubro = await prisma.rubro.findFirst({
    where: { slug: rubroSlug, activo: true },
    select: { id: true, slug: true },
  })
  if (!rubro) return { ok: false, mensaje: 'Ese rubro no está disponible.' }

  const snap = leerSnapshotCobertura(proveedor.solicitudEspera)
  if (!snap || !snap.rubros.includes(rubroSlug)) {
    return { ok: false, mensaje: 'Ese rubro no está en tu cobertura.' }
  }

  const audienciasPorRubro = {
    ...(snap.audienciasPorRubro ?? {}),
    [rubroSlug]: parseo.audiencias,
  }

  await prisma.$transaction([
    prisma.proveedor.update({
      where: { id: proveedor.id },
      data: {
        solicitudEspera: {
          ...snap,
          audienciasPorRubro,
        } as Prisma.InputJsonValue,
      },
    }),
    prisma.cobertura.updateMany({
      where: { proveedorId: proveedor.id, rubroId: rubro.id },
      data: { audiencias: parseo.audiencias },
    }),
  ])

  revalidatePath('/panel')
  return { ok: true, mensaje: 'Audiencia actualizada.' }
}
