import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

import { authConfig } from '@/auth.config'
import { decidirAccesoAdmin } from '@/lib/admin-ruta'
import { ROLES } from '@/lib/roles'

const { auth } = NextAuth(authConfig)

/**
 * Gate del panel de admin.
 *
 * El rewrite {ADMIN_PATH} → /admin vive en next.config.ts y corre DESPUÉS del
 * middleware, así que acá todavía vemos la URL que pidió el navegador: eso es
 * lo que permite distinguir el acceso por la ruta secreta del acceso directo
 * a /admin/*, que siempre responde 404.
 *
 * Esto es solo la primera capa. El rol se vuelve a validar en el servidor en
 * cada página del panel (src/server/sesion.ts), que es la seguridad real.
 *
 * No importar @prisma/client acá: el middleware es Edge y Vercel rechaza el
 * deploy si el bundle arrastra el client de Prisma.
 */
export default auth((req) => {
  const decision = decidirAccesoAdmin({
    pathname: req.nextUrl.pathname,
    adminPath: process.env.ADMIN_PATH,
    esAdmin: req.auth?.user?.rol === ROLES.ADMIN,
  })

  if (decision === 'no-encontrado') {
    // 404 real, con la misma página de "no encontrado" del sitio: no
    // confirmamos que la ruta exista ni que falte permiso.
    return NextResponse.rewrite(new URL('/no-encontrado', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
