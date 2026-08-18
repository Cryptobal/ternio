import 'server-only'

import { notFound, redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { EstadoProveedor, RolUsuario } from '@prisma/client'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { capacidadesDe } from '@/server/capacidades'
import { destinoPorCapacidades } from '@/lib/capacidades'

/**
 * Helpers de sesión del lado del servidor.
 *
 * Ocultar un botón no protege nada: cada página del panel llama a estos
 * helpers y el acceso no autorizado responde 404, sin confirmar que la ruta
 * exista.
 */

export async function sesionActual(): Promise<Session | null> {
  return auth()
}

export async function requerirAdmin(): Promise<Session> {
  const sesion = await auth()
  if (!sesion?.user || sesion.user.rol !== RolUsuario.ADMIN) notFound()
  return sesion
}

/** Devuelve el id del comprador con sesión iniciada, o null. */
export async function usuarioActualId(): Promise<string | null> {
  const sesion = await auth()
  return sesion?.user?.id ?? null
}

/**
 * Exige perfil de proveedor (no solo el escalar rol) y estado distinto de
 * RECHAZADO. El resto responde 404: no confirmar que /panel exista.
 */
export async function requerirProveedor(): Promise<Session> {
  const sesion = await auth()
  if (!sesion?.user?.id) redirect('/entrar')

  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId: sesion.user.id },
    select: { id: true, estado: true },
  })
  if (!proveedor || proveedor.estado === EstadoProveedor.RECHAZADO) notFound()
  return sesion
}

/** /panel: sesión iniciada; la página decide aviso vs contenido. */
export async function sesionParaPanel(): Promise<Session | null> {
  const sesion = await auth()
  if (!sesion?.user?.id) redirect('/entrar')
  return sesion
}

export async function redirigirSiHaySesion(): Promise<void> {
  const sesion = await auth()
  if (!sesion?.user?.id) return
  const caps = await capacidadesDe(sesion.user.id)
  redirect(destinoPorCapacidades(caps))
}
