/**
 * URLs públicas de metadata (OG, Twitter, metadataBase).
 * WhatsApp y varios crawlers fallan con apex y con rutas sin extensión.
 * Siempre www + PNG estático.
 */
export const URL_SITIO_CANONICA = 'https://www.ternio.cl'
export const URL_OG_PNG = `${URL_SITIO_CANONICA}/og.png`

export const OG_IMAGE = {
  url: URL_OG_PNG,
  secureUrl: URL_OG_PNG,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Ternio — cotiza servicios para tu empresa',
} as const
