import type { NextConfig } from 'next'

import { ALIAS_SEO_308 } from './src/lib/seo-rutas'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return ALIAS_SEO_308.map((alias) => ({
      source: alias.origen,
      destination: alias.destino,
      permanent: true,
    }))
  },
}

export default nextConfig
