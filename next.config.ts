import type { NextConfig } from 'next'

/**
 * El panel de admin vive bajo una ruta oculta definida por env (ADMIN_PATH).
 * El rewrite es puramente cosmético: la seguridad real es el rol ADMIN
 * validado en servidor (ver src/middleware.ts y src/lib/admin-guard.ts).
 * Sin ADMIN_PATH no se publica ninguna entrada de admin.
 */
const adminPath = process.env.ADMIN_PATH?.replace(/^\/+|\/+$/g, '') ?? ''

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    if (!adminPath) return []
    return [
      { source: `/${adminPath}`, destination: '/admin' },
      { source: `/${adminPath}/:path*`, destination: '/admin/:path*' },
    ]
  },
}

export default nextConfig
