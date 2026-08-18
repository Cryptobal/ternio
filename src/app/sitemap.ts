import type { MetadataRoute } from 'next'

import { urlsSitemapFijas } from '@/lib/sitemap-publico'

/**
 * Sitemap dinámico: solo páginas públicas.
 *
 * No incluye el panel de admin, /mis-cotizaciones ni el flujo post-envío.
 * Si la base no responde, devolvemos las URLs fijas: un 500 acá deja al
 * sitio fuera de Google.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl').replace(/\/+$/, '')
  const ahora = new Date()

  const fijas: MetadataRoute.Sitemap = urlsSitemapFijas(base).map((url) => ({
    url,
    lastModified: ahora,
    changeFrequency: url.endsWith('/proveedores') ? ('monthly' as const) : ('weekly' as const),
    priority: url === `${base}/` ? 1 : url.endsWith('/proveedores') ? 0.6 : 0.2,
  }))

  try {
    const { combinacionesPublicadas, rubrosActivos } = await import('@/lib/catalogo')
    const [rubros, combinaciones] = await Promise.all([rubrosActivos(), combinacionesPublicadas()])

    return [
      ...fijas,
      ...rubros.map((rubro) => ({
        url: `${base}/${rubro.slug}`,
        lastModified: ahora,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...combinaciones.map((combinacion) => ({
        url: `${base}/${combinacion.rubro}/${combinacion.comuna}`,
        lastModified: ahora,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch (error) {
    console.error(
      '[sitemap] no se pudo armar el catálogo; se publican solo las URLs fijas.',
      error instanceof Error ? error.message : 'error desconocido',
    )
    return fijas
  }
}
