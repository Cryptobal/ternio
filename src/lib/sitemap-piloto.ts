/**
 * Rutas extra del sitemap sin tocar Prisma.
 *
 * Duplica a propósito los slugs de `prisma/catalogo-inicial.ts` (RUBROS +
 * COMUNAS_SEO). El sitemap no puede importar ese archivo: arrastra
 * `@prisma/client` y un 500 al cargar el módulo deja el sitio fuera de Google.
 */

export const SLUGS_RUBRO_SITEMAP = [
  'seguridad',
  'aseo',
  'control-de-plagas',
  'banos-quimicos',
  'generadores',
  'transporte-de-personal',
  'transporte-de-carga',
  'climatizacion-industrial',
] as const

export const COMUNAS_SITEMAP_PILOTO = [
  'santiago',
  'las-condes',
  'providencia',
  'vitacura',
  'nunoa',
  'maipu',
  'quilicura',
  'pudahuel',
] as const
