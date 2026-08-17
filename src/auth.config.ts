import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { RolUsuario } from '@prisma/client'

/**
 * Configuración de Auth.js compartida con el edge (middleware).
 *
 * No puede importar Prisma ni node:crypto: el middleware corre en edge y
 * solo necesita decodificar el JWT para saber si hay sesión y con qué rol.
 * El adapter y el provider Credentials viven en src/auth.ts.
 */

/**
 * Sin credenciales de Google no hay login de comprador. El formulario sigue
 * funcionando igual: el lead se guarda y queda para revisión del admin.
 */
export function googleConfigurado(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
}

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: googleConfigurado() ? [Google] : [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.rol = (token.rol as RolUsuario | undefined) ?? RolUsuario.COMPRADOR
      }
      return session
    },
  },
} satisfies NextAuthConfig
