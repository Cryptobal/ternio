import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { EstadoProveedor, RolUsuario } from '@prisma/client'

import { authConfig } from '@/auth.config'
import { hashTokenSesionOtp } from '@/lib/otp'
import { prisma } from '@/lib/prisma'
import { verificarPassword } from '@/lib/password'
import { consumirRateLimit } from '@/lib/rate-limit'

/**
 * Auth.js v5 con tres entradas:
 *  - Credentials `otp`: sesión tras consumir un código SMS (comprador o proveedor).
 *  - Credentials `proveedor`: correo + contraseña, solo con perfil Proveedor.
 *  - Credentials `admin`: solo para el dueño (rol ADMIN), en /admin.
 *
 * Estrategia JWT: es la única compatible con Credentials, y deja el rol
 * disponible en el edge para el gate del panel de admin.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      id: 'otp',
      name: 'OTP',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credenciales) {
        const crudo = String(credenciales?.token ?? '')
        if (!crudo) return null

        const hash = hashTokenSesionOtp(crudo)
        const fila = await prisma.verificationToken.findFirst({
          where: { token: hash, expires: { gt: new Date() } },
        })
        if (!fila?.identifier.startsWith('otp-sesion:')) return null

        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: fila.identifier, token: fila.token } },
        })

        const usuarioId = fila.identifier.slice('otp-sesion:'.length)
        const usuario = await prisma.user.findUnique({ where: { id: usuarioId } })
        if (!usuario || usuario.rol === RolUsuario.ADMIN) return null
        if (!usuario.telefonoE164Verificado) return null

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          rol: usuario.rol,
        }
      },
    }),
    Credentials({
      id: 'proveedor',
      name: 'Proveedor',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credenciales) {
        const email = String(credenciales?.email ?? '').trim().toLowerCase()
        const password = String(credenciales?.password ?? '')
        if (!email || !password) return null

        const limiteEmail = consumirRateLimit(`login-proveedor:${email}`, 5, 5 * 60_000)
        if (!limiteEmail.permitido) return null

        const usuario = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            rol: true,
            passwordHash: true,
            proveedor: { select: { id: true, estado: true } },
          },
        })
        // Fail-closed: admin solo por su puerta; sin perfil o suspendido/rechazado → null.
        if (!usuario || usuario.rol === RolUsuario.ADMIN) return null
        if (!usuario.passwordHash || !usuario.proveedor) return null
        if (
          usuario.proveedor.estado === EstadoProveedor.SUSPENDIDO ||
          usuario.proveedor.estado === EstadoProveedor.RECHAZADO
        ) {
          return null
        }

        const valida = await verificarPassword(password, usuario.passwordHash)
        if (!valida) return null

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          rol: usuario.rol,
        }
      },
    }),
    Credentials({
      id: 'admin',
      name: 'Admin',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credenciales) {
        const email = String(credenciales?.email ?? '').trim().toLowerCase()
        const password = String(credenciales?.password ?? '')
        if (!email || !password) return null

        const limite = consumirRateLimit(`login-admin:${email}`, 5, 5 * 60_000)
        if (!limite.permitido) return null

        const usuario = await prisma.user.findUnique({ where: { email } })
        if (!usuario || usuario.rol !== RolUsuario.ADMIN) return null

        const valida = await verificarPassword(password, usuario.passwordHash)
        if (!valida) return null

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          rol: usuario.rol,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
        const fila = await prisma.user.findUnique({
          where: { id: user.id },
          select: { rol: true },
        })
        token.rol = fila?.rol ?? RolUsuario.COMPRADOR
      }
      return token
    },
  },
})
