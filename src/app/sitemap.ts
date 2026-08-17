import type { MetadataRoute } from 'next'

import { combinacionesPublicadas, rubrosActivos } from '@/lib/catalogo'

/**
 * Sitemap dinámico: solo páginas públicas.
 *
 * No incluye el panel de admin, /mis-cotizaciones ni el flujo post-envío:
 * son privados y van con noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl').replace(/\/+$/, '')
  const ahora = new Date()

  const [rubros, combinaciones] = await Promise.all([rubrosActivos(), combinacionesPublicadas()])

  return [
    { url: `${base}/`, lastModified: ahora, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/privacidad`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.2 },
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
}
