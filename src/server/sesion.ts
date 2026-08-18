import 'server-only'

import { notFound, redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { RolUsuario } from '@prisma/client'

import { auth } from '@/auth'
import { destinoTrasLogin } from '@/lib/roles'

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

export async function requerirProveedor(): Promise<Session> {
  const sesion = await auth()
  if (!sesion?.user?.id) redirect('/entrar')
  if (sesion.user.rol !== RolUsuario.PROVEEDOR) notFound()
  return sesion
}

/** /panel: el comprador ve un aviso, no lo mandamos al otro lado en silencio. */
export async function sesionParaPanel(): Promise<Session | null> {
  const sesion = await auth()
  if (!sesion?.user?.id) redirect('/entrar')
  return sesion
}

export async function redirigirSiHaySesion(): Promise<void> {
  const sesion = await auth()
  if (sesion?.user?.id) redirect(destinoTrasLogin(sesion.user.rol))
}
