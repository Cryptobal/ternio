import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  armarSitemapXml,
  entradasSitemap,
  esAliasSeo,
  esPathSitemapProhibido,
  pathsSitemapPiloto,
  RUTAS_EXCLUIDAS_SITEMAP,
  RUTAS_SITEMAP_FIJAS,
  sitemapMinimoXml,
  urlsSitemapFijas,
} from '@/lib/sitemap-publico'

const BASE = 'https://ternio.cl'

describe('sitemap público', () => {
  it('el mínimo incluye home, 3 rubros y /proveedores', () => {
    expect([...RUTAS_SITEMAP_FIJAS]).toEqual([
      '/',
      '/seguridad',
      '/aseo',
      '/plagas',
      '/proveedores',
      '/privacidad',
      '/terminos',
    ])
    expect(urlsSitemapFijas(BASE)).toEqual([
      'https://ternio.cl/',
      'https://ternio.cl/seguridad',
      'https://ternio.cl/aseo',
      'https://ternio.cl/plagas',
      'https://ternio.cl/proveedores',
      'https://ternio.cl/privacidad',
      'https://ternio.cl/terminos',
    ])
  })

  it('excluye /admin y /panel', () => {
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/admin')
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/panel')
    expect(esPathSitemapProhibido('/admin')).toBe(true)
    expect(esPathSitemapProhibido('/admin/compradores')).toBe(true)
    expect(esPathSitemapProhibido('/panel')).toBe(true)
    expect(esPathSitemapProhibido('/seguridad')).toBe(false)
    const locs = armarSitemapXml(BASE).locs
    expect(locs.some((url) => url.includes('/admin'))).toBe(false)
    expect(locs.some((url) => url.includes('/panel'))).toBe(false)
  })

  it('no lista alias 308 (canónica /plagas, no /control-de-plagas)', () => {
    expect(esAliasSeo('/control-de-plagas')).toBe(true)
    expect(esAliasSeo('/control-de-plagas/santiago')).toBe(true)
    expect(esAliasSeo('/guardias')).toBe(true)
    expect(esAliasSeo('/plagas')).toBe(false)
    const paths = pathsSitemapPiloto()
    expect(paths).toContain('/plagas')
    expect(paths).toContain('/plagas/santiago')
    expect(paths).not.toContain('/control-de-plagas')
    const locs = armarSitemapXml(BASE).locs
    expect(locs).toContain('https://ternio.cl/plagas')
    expect(locs.some((url) => url.includes('/control-de-plagas'))).toBe(false)
  })

  it('filtra extras prohibidos o alias y no truena', () => {
    const entradas = entradasSitemap(BASE, [
      '/admin',
      '/panel',
      '/guardias',
      '/control-de-plagas',
      '/seguridad/santiago',
    ])
    const locs = entradas.map((e) => e.loc)
    expect(locs).toContain('https://ternio.cl/')
    expect(locs).toContain('https://ternio.cl/seguridad/santiago')
    expect(locs).not.toContain('https://ternio.cl/admin')
    expect(locs).not.toContain('https://ternio.cl/guardias')
    expect(armarSitemapXml(BASE).xml).toMatch(/^<\?xml /)
    expect(sitemapMinimoXml(BASE)).toContain('https://ternio.cl/seguridad')
  })

  it('el route del sitemap no importa el catálogo ni el client de Prisma', () => {
    const ruta = readFileSync(resolve(process.cwd(), 'src/app/sitemap.xml/route.ts'), 'utf8')
    expect(ruta).not.toMatch(/from ['"]@\/lib\/catalogo['"]/)
    expect(ruta).not.toMatch(/from ['"]@\/lib\/prisma['"]/)
    expect(ruta).not.toMatch(/from ['"]@prisma\/client['"]/)
    expect(ruta).toMatch(/status: 200/)
  })
})
