import type { NextConfig } from 'next'

import { ALIAS_SEO_308 } from './src/lib/seo-rutas'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  outputFileTracingIncludes: {
    '/blog': ['./content/blog/**/*'],
    '/blog/[slug]': ['./content/blog/**/*'],
    '/blog/rss.xml': ['./content/blog/**/*'],
    '/sitemap.xml': ['./content/blog/**/*'],
  },
  async redirects() {
    return ALIAS_SEO_308.map((alias) => ({
      source: alias.origen,
      destination: alias.destino,
      permanent: true,
    }))
  },
}

export default nextConfig
