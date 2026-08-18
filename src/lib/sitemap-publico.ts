/**
 * Rutas fijas del sitemap público. El panel de admin y los flujos privados
 * no se listan acá: no se indexan.
 */
export const RUTAS_SITEMAP_FIJAS = ['/', '/privacidad', '/terminos', '/proveedores'] as const

export const RUTAS_EXCLUIDAS_SITEMAP = [
  '/admin',
  '/mis-cotizaciones',
  '/cotizacion',
  '/entrar',
] as const

export function urlsSitemapFijas(base: string): string[] {
  return RUTAS_SITEMAP_FIJAS.map((ruta) => `${base}${ruta === '/' ? '/' : ruta}`)
}
