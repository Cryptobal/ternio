import type { MetadataRoute } from 'next'

/**
 * robots.txt.
 *
 * El panel de admin NO se menciona acá. Listarlo en robots.txt sería
 * publicarlo — el archivo es público. El panel se protege con el rol ADMIN
 * validado en servidor, y todo lo demás responde 404.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Solo paneles del comprador y flujos privados; nada de admin.
        disallow: ['/mis-cotizaciones', '/cotizacion/', '/entrar', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
