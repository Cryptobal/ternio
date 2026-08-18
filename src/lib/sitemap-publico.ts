/**
 * Rutas fijas del sitemap público. El panel de admin y los flujos privados
 * no se listan acá: no se indexan.
 */
/** Si la base falla, igual se listan home + 3 rubros en VENTA. Nunca 500. */
export const RUTAS_SITEMAP_FIJAS = [
  '/',
  '/seguridad',
  '/aseo',
  '/plagas',
  '/privacidad',
  '/terminos',
  '/proveedores',
] as const

export const RUTAS_EXCLUIDAS_SITEMAP = [
  '/admin',
  '/mis-cotizaciones',
  '/cotizacion',
  '/entrar',
  '/panel',
] as const

export function urlsSitemapFijas(base: string): string[] {
  return RUTAS_SITEMAP_FIJAS.map((ruta) => `${base}${ruta === '/' ? '/' : ruta}`)
}
