import type { NextAuthConfig } from 'next-auth'

import { ROLES, type Rol } from '@/lib/roles'

/**
 * Configuración de Auth.js compartida con el edge (middleware).
 *
 * No puede importar Prisma ni node:crypto: el middleware corre en edge y
 * solo necesita decodificar el JWT para saber si hay sesión y con qué rol.
 * El adapter y los providers Credentials (admin + otp) viven en src/auth.ts.
 *
 * Tampoco puede importar valores desde `@prisma/client` (ni enums): Vercel
 * falla al desplegar la Edge Function si el bundle referencia `.prisma`.
 */

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.rol = (token.rol as Rol | undefined) ?? ROLES.COMPRADOR
      }
      return session
    },
  },
} satisfies NextAuthConfig
