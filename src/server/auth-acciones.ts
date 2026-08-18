'use server'

import { AuthError } from 'next-auth'

import { signIn, signOut } from '@/auth'
import { rutaAdmin } from '@/lib/admin-ruta'

export async function salir(): Promise<void> {
  await signOut({ redirectTo: '/' })
}

export type EstadoLoginAdmin = { error?: string }

/** Login del dueño, solo alcanzable desde /admin/ingresar. */
export async function entrarComoAdmin(
  _estadoPrevio: EstadoLoginAdmin,
  formData: FormData,
): Promise<EstadoLoginAdmin> {
  try {
    await signIn('admin', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: rutaAdmin(),
    })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'No pudimos iniciar sesión con esos datos.' }
    }
    throw error
  }
}
