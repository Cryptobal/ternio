import type { MetadataRoute } from 'next'

/**
 * robots.txt.
 *
 * Ojo: la ruta del panel de admin (ADMIN_PATH) NO se menciona acá.
 * Listarla en robots.txt sería publicarla — el archivo es público. El panel se
 * protege con el rol ADMIN validado en servidor, y todo lo demás responde 404.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Solo paneles del comprador y flujos privados; nada de admin.
        disallow: ['/mis-cotizaciones', '/cotizacion/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
