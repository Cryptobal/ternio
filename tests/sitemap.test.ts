import { describe, expect, it } from 'vitest'

import {
  RUTAS_EXCLUIDAS_SITEMAP,
  RUTAS_SITEMAP_FIJAS,
  urlsSitemapFijas,
} from '@/lib/sitemap-publico'

describe('sitemap público', () => {
  it('incluye /proveedores y las rutas fijas', () => {
    expect(RUTAS_SITEMAP_FIJAS).toContain('/proveedores')
    expect(urlsSitemapFijas('https://ternio.cl')).toEqual([
      'https://ternio.cl/',
      'https://ternio.cl/seguridad',
      'https://ternio.cl/aseo',
      'https://ternio.cl/plagas',
      'https://ternio.cl/privacidad',
      'https://ternio.cl/terminos',
      'https://ternio.cl/proveedores',
    ])
  })

  it('excluye /admin y los flujos privados', () => {
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/admin')
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/panel')
    expect(RUTAS_SITEMAP_FIJAS.join(' ')).not.toMatch(/admin/)
    expect(urlsSitemapFijas('https://ternio.cl').some((url) => url.includes('/admin'))).toBe(
      false,
    )
  })
})
