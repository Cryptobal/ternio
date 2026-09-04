import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { urlPublicaSitio } from '@/lib/metadata-publico'
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

const BASE = 'https://www.ternio.cl'

describe('sitemap público', () => {
  it('el mínimo incluye home y las landings VENTA (no aliases)', () => {
    expect(RUTAS_SITEMAP_FIJAS).toContain('/seguridad')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/gasfiteria')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/aseo-hogar')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/asesoria-financiera')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/seguros')
    expect(RUTAS_SITEMAP_FIJAS).toContain('/blog')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/plagas')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/climatizacion')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/gasfiter')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/guardia')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/guarda')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/nana')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/aseo-a-domicilio')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/creditos')
    expect(RUTAS_SITEMAP_FIJAS).not.toContain('/maestro')
    expect(urlsSitemapFijas(BASE)[0]).toBe('https://www.ternio.cl/')
    expect(urlsSitemapFijas(BASE)).toContain('https://www.ternio.cl/gasfiteria')
    expect(urlsSitemapFijas(BASE)).toContain('https://www.ternio.cl/proveedores')
    expect(urlsSitemapFijas(BASE)).toContain('https://www.ternio.cl/blog')
    expect(urlsSitemapFijas(BASE)).toContain('https://www.ternio.cl/como-funciona')
    expect(urlsSitemapFijas(BASE)).toContain('https://www.ternio.cl/precios')
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
    expect(esAliasSeo('/guardia')).toBe(true)
    expect(esAliasSeo('/guarda-de-seguridad/las-condes')).toBe(true)
    expect(esAliasSeo('/nana')).toBe(true)
    expect(esAliasSeo('/aseo-a-domicilio/santiago')).toBe(true)
    expect(esAliasSeo('/seguridad')).toBe(false)
    expect(esAliasSeo('/aseo-hogar')).toBe(false)
    expect(esAliasSeo('/control-de-plagas')).toBe(false)
    const paths = pathsSitemapPiloto()
    expect(paths).toContain('/control-de-plagas')
    expect(paths).toContain('/control-de-plagas/santiago')
    expect(paths).not.toContain('/plagas')
    const locs = armarSitemapXml(BASE).locs
    expect(locs).toContain('https://www.ternio.cl/control-de-plagas')
    expect(locs.some((url) => /\/plagas(\/|$)/.test(url.replace('https://www.ternio.cl', '')))).toBe(
      false,
    )
  })

  it('incluye perfiles /empresa pasados como extras', () => {
    const locs = armarSitemapXml(BASE, new Date(), ['/empresa/gard-security']).locs
    expect(locs).toContain('https://www.ternio.cl/empresa/gard-security')
  })

  it('filtra extras prohibidos o alias y no truena', () => {
    const entradas = entradasSitemap(BASE, ['/admin', '/panel', '/guardias', '/plagas', '/seguridad/santiago'])
    const locs = entradas.map((e) => e.loc)
    expect(locs).toContain('https://www.ternio.cl/seguridad/santiago')
    expect(locs).not.toContain('https://www.ternio.cl/plagas')
    expect(armarSitemapXml(BASE).xml).toMatch(/^<\?xml /)
    expect(sitemapMinimoXml(BASE)).toContain('https://www.ternio.cl/control-de-plagas')
  })

  it('lista /blog y los slugs de los artículos, con host www', () => {
    const { locs, xml } = armarSitemapXml('https://ternio.cl')
    expect(locs).toContain('https://www.ternio.cl/blog')
    expect(locs).toContain('https://www.ternio.cl/blog/cuanto-cuesta-un-guardia-de-seguridad-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/como-elegir-empresa-de-aseo-industrial')
    expect(locs).toContain('https://www.ternio.cl/blog/control-de-plagas-casa-o-empresa-que-pedir')
    expect(locs).toContain('https://www.ternio.cl/blog/mudanza-en-santiago-que-cotizar')
    expect(locs).toContain('https://www.ternio.cl/blog/contador-para-pyme-f29-y-remuneraciones')
    expect(locs).toContain('https://www.ternio.cl/blog/gasfiter-de-urgencia-vs-programado')
    expect(locs).toContain('https://www.ternio.cl/blog/destape-de-urgencia-vs-programado')
    expect(locs).toContain('https://www.ternio.cl/blog/como-contratar-empresa-de-seguridad-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/camaras-o-guardia-para-empresa-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/ronda-o-puesto-fijo-para-empresa-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/reemplazo-de-guardia-que-exigir-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/guardia-24-7-o-diurno-para-empresa-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/supervisor-de-seguridad-cuando-pedirlo-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/bitacora-de-guardia-que-exigir-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/guardia-armado-o-desarmado-para-empresa-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/control-de-acceso-y-visitas-para-empresa-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/seguridad-de-urgencia-o-programada-para-empresa-en-chile')
    expect(locs).toContain('https://www.ternio.cl/blog/turno-4x3-o-5x2-del-guardia-para-empresa-en-chile')
    expect(locs).toContain(
      'https://www.ternio.cl/blog/os-10-vigente-que-verificar-al-cotizar-seguridad-empresa-chile',
    )
    expect(xml).toContain('https://www.ternio.cl/blog')
    expect(locs.some((url) => url.startsWith('https://ternio.cl/'))).toBe(false)
  })

  it('el route del sitemap no importa el catálogo ni Prisma directo', () => {
    const ruta = readFileSync(resolve(process.cwd(), 'src/app/sitemap.xml/route.ts'), 'utf8')
    expect(ruta).not.toMatch(/from ['"]@\/lib\/catalogo['"]/)
    expect(ruta).not.toMatch(/from ['"]@\/lib\/prisma['"]/)
    expect(ruta).not.toMatch(/from ['"]@prisma\/client['"]/)
    expect(ruta).toMatch(/status: 200/)
    expect(ruta).toMatch(/urlPublicaSitio/)
    expect(ruta).toMatch(/pathsEmpresasSitemap/)
  })

  it('robots.txt apunta al sitemap www y no menciona /admin', () => {
    const robots = readFileSync(resolve(process.cwd(), 'src/app/robots.ts'), 'utf8')
    expect(robots).toContain('urlPublicaSitio')
    expect(robots).not.toContain('/admin')
    expect(robots).not.toContain("?? 'https://ternio.cl'")
    expect(urlPublicaSitio('https://ternio.cl')).toBe('https://www.ternio.cl')
    expect(urlPublicaSitio('https://www.ternio.cl/')).toBe('https://www.ternio.cl')
  })
})
