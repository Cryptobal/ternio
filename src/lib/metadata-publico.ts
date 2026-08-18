/**
 * URLs públicas de metadata (OG, Twitter, metadataBase).
 * WhatsApp y varios crawlers fallan con apex y con rutas sin extensión.
 * Siempre www + PNG estático.
 */
export const URL_SITIO_CANONICA = 'https://www.ternio.cl'
export const URL_OG_PNG = `${URL_SITIO_CANONICA}/og.png`

/**
 * Host público = el de los canonicals. Apex `ternio.cl` ya hace 308 a www;
 * sitemap y robots no deben publicar el apex.
 */
export function urlPublicaSitio(cruda?: string): string {
  const valor = (cruda ?? process.env.NEXT_PUBLIC_SITIO_URL ?? URL_SITIO_CANONICA).replace(/\/+$/, '')
  try {
    const url = new URL(valor.includes('://') ? valor : `https://${valor}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return URL_SITIO_CANONICA
    }
    if (url.hostname === 'ternio.cl') {
      url.hostname = 'www.ternio.cl'
    }
    return url.origin
  } catch {
    return URL_SITIO_CANONICA
  }
}

export const OG_IMAGE = {
  url: URL_OG_PNG,
  secureUrl: URL_OG_PNG,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Ternio — cotiza servicios para tu empresa',
} as const
