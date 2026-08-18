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
  it('el mínimo incluye home y las landings VENTA (no aliases)', () => {
    expect(RUTAS_SITEMAP_FIJAS).toContain('/seguridad')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/gasfiteria')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/aseo-hogar')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/asesoria-financiera')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/seguros')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/plagas')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/climatizacion')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/gasfiter')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/creditos')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/maestro')
    expect(urlsSitemapFijas(BASE)[0]).toBe('https://ternio.cl/')
    expect(urlsSitemapFijas(BASE)).toContain('https://ternio.cl/gasfiteria')
    expect(urlsSitemapFijas(BASE)).toContain('https://ternio.cl/proveedores')
  })

  it('excluye /admin y /panel', () => {
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/admin')
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/no-encontrado')
    expect(RUTAS_EXCLUIDAS_SITEMAP).toContain('/panel')
    expect(esPathSitemapProhibido('/admin')).toBe(true)
    expect(esPathSitemapProhibido('/panel')).toBe(true)
    const locs = armarSitemapXml(BASE).locs
    expect(locs.some((url) => url.includes('/admin'))).toBe(false)
    expect(locs.some((url) => url.includes('/panel'))).toBe(false)
  })

  it('lista /control-de-plagas y no el alias /plagas', () => {
    expect(esAliasSeo('/plagas')).toBe(true)
    expect(esAliasSeo('/plagas/santiago')).toBe(true)
    expect(esAliasSeo('/control-de-plagas')).toBe(false)
    const paths = pathsSitemapPiloto()
    expect(paths).toContain('/control-de-plagas')
    expect(paths).toContain('/control-de-plagas/santiago')
    expect(paths).not.toContain('/plagas')
    const locs = armarSitemapXml(BASE).locs
    expect(locs).toContain('https://ternio.cl/control-de-plagas')
    expect(locs.some((url) => /\/plagas(\/|$)/.test(url.replace('https://ternio.cl', '')))).toBe(
      false,
    )
  })

  it('filtra extras prohibidos o alias y no truena', () => {
    const entradas = entradasSitemap(BASE, ['/admin', '/panel', '/guardias', '/plagas', '/seguridad/santiago'])
    const locs = entradas.map((e) => e.loc)
    expect(locs).toContain('https://ternio.cl/seguridad/santiago')
    expect(locs).not.toContain('https://ternio.cl/plagas')
    expect(armarSitemapXml(BASE).xml).toMatch(/^<\?xml /)
    expect(sitemapMinimoXml(BASE)).toContain('https://ternio.cl/control-de-plagas')
  })

  it('el route del sitemap no importa el catálogo ni Prisma', () => {
    const ruta = readFileSync(resolve(process.cwd(), 'src/app/sitemap.xml/route.ts'), 'utf8')
    expect(ruta).not.toMatch(/from ['"]@\/lib\/catalogo['"]/)
    expect(ruta).not.toMatch(/from ['"]@\/lib\/prisma['"]/)
    expect(ruta).not.toMatch(/from ['"]@prisma\/client['"]/)
    expect(ruta).toMatch(/status: 200/)
  })
})
