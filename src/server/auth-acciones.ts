'use server'

import { AuthError } from 'next-auth'

import { signIn, signOut } from '@/auth'
import { rutaAdmin } from '@/lib/admin-ruta'

/** Login del comprador. Solo se le ofrece DESPUÉS de enviar el formulario. */
export async function entrarConGoogle(formData: FormData): Promise<void> {
  const destino = String(formData.get('destino') ?? '/mis-cotizaciones')
  await signIn('google', { redirectTo: destino })
}

export async function salir(): Promise<void> {
  await signOut({ redirectTo: '/' })
}

export type EstadoLoginAdmin = { error?: string }

/** Login del dueño, solo alcanzable desde la ruta oculta. */
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
      // Mensaje único a propósito: no distinguimos "no existe" de "clave mala".
      return { error: 'No pudimos iniciar sesión con esos datos.' }
    }
    throw error
  }
}
