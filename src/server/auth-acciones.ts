'use server'

import { AuthError } from 'next-auth'
import { headers } from 'next/headers'
import { EstadoProveedor, RolUsuario } from '@prisma/client'

import { signIn, signOut } from '@/auth'
import { rutaAdmin } from '@/lib/admin-ruta'
import { errorPasswordProveedor } from '@/lib/cuenta-proveedor'
import { hashPassword, verificarPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'
import { destinoTrasLoginUsuario } from '@/server/capacidades'
import { requerirProveedor } from '@/server/sesion'

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

export type EstadoLoginProveedor = { error?: string }

async function ipDelCliente(): Promise<string> {
  const cabeceras = await headers()
  const reenviada = cabeceras.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || cabeceras.get('x-real-ip') || 'desconocida'
}

/**
 * Login proveedor por correo + contraseña. Mensajes genéricos salvo
 * SUSPENDIDO/RECHAZADO (explícitos). Rate limit por correo e IP.
 */
export async function entrarComoProveedor(
  _estadoPrevio: EstadoLoginProveedor,
  formData: FormData,
): Promise<EstadoLoginProveedor> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  const ip = await ipDelCliente()
  const limiteIp = consumirRateLimit(`login-proveedor-ip:${ip}`, 20, 5 * 60_000)
  const limiteEmail = consumirRateLimit(`login-proveedor-pre:${email}`, 5, 5 * 60_000)
  if (!limiteIp.permitido || !limiteEmail.permitido) {
    return { error: 'Demasiados intentos. Espera unos minutos y reintenta.' }
  }

  const usuario = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      rol: true,
      passwordHash: true,
      proveedor: { select: { estado: true } },
    },
  })

  if (!usuario || usuario.rol === RolUsuario.ADMIN || !usuario.passwordHash || !usuario.proveedor) {
    // Timing roughly comparable: still verify a dummy when missing.
    await verificarPassword(password, usuario?.passwordHash ?? null)
    return { error: 'Correo o contraseña incorrectos.' }
  }

  if (usuario.proveedor.estado === EstadoProveedor.SUSPENDIDO) {
    return {
      error: 'Tu cuenta está suspendida. Escríbenos a soporte si esto es un error.',
    }
  }
  if (usuario.proveedor.estado === EstadoProveedor.RECHAZADO) {
    return { error: 'No pudimos continuar con esta cuenta.' }
  }

  const valida = await verificarPassword(password, usuario.passwordHash)
  if (!valida) return { error: 'Correo o contraseña incorrectos.' }

  const destino = await destinoTrasLoginUsuario(usuario.id)

  try {
    await signIn('proveedor', { email, password, redirectTo: destino })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Correo o contraseña incorrectos.' }
    }
    throw error
  }
}

export type EstadoPasswordProveedor = {
  ok: boolean
  mensaje?: string
  errores?: Record<string, string>
}

export async function cambiarPasswordProveedorAction(
  _previo: EstadoPasswordProveedor,
  formData: FormData,
): Promise<EstadoPasswordProveedor> {
  const sesion = await requerirProveedor()
  const password = String(formData.get('password') ?? '')
  const passwordConfirmacion = String(formData.get('passwordConfirmacion') ?? '')

  const ePassword = errorPasswordProveedor(password)
  if (ePassword) return { ok: false, errores: { password: ePassword } }
  if (password !== passwordConfirmacion) {
    return { ok: false, errores: { passwordConfirmacion: 'Las contraseñas no coinciden.' } }
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.update({
    where: { id: sesion.user.id },
    data: { passwordHash },
  })

  return { ok: true, mensaje: 'Contraseña actualizada. Ya puedes entrar con correo.' }
}
