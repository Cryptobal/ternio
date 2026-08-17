import 'server-only'

import { notFound } from 'next/navigation'
import type { Session } from 'next-auth'
import { RolUsuario } from '@prisma/client'

import { auth } from '@/auth'

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
