import { ALIAS_SEO_308, pathPublicoCombo, pathPublicoRubro } from '@/lib/seo-rutas'
import { COMUNAS_SITEMAP_PILOTO, SLUGS_RUBRO_SITEMAP } from '@/lib/sitemap-piloto'

/**
 * Rutas fijas: el mínimo que Google tiene que ver aunque falle todo lo demás.
 * Nunca /admin ni /panel.
 */
export const RUTAS_SITEMAP_FIJAS = [
  '/',
  '/seguridad',
  '/aseo',
  '/control-de-plagas',
  '/proveedores',
  '/privacidad',
  '/terminos',
] as const

export const RUTAS_EXCLUIDAS_SITEMAP = [
  '/admin',
  '/mis-cotizaciones',
  '/cotizacion',
  '/entrar',
  '/panel',
  '/api',
] as const

export type EntradaSitemap = {
  loc: string
  changefreq: 'weekly' | 'monthly'
  priority: number
}

export function urlsSitemapFijas(base: string): string[] {
  return RUTAS_SITEMAP_FIJAS.map((ruta) => locSitemap(base, ruta))
}

export function baseSitemap(base: string): string {
  try {
    const cruda = base.includes('://') ? base : `https://${base}`
    const url = new URL(cruda)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.origin.replace(/\/+$/, '')
    }
  } catch {
    /* fallback */
  }
  return 'https://ternio.cl'
}

export function locSitemap(base: string, path: string): string {
  const origen = baseSitemap(base)
  if (path === '/') return `${origen}/`
  return `${origen}${path.startsWith('/') ? path : `/${path}`}`
}

export function esLocSitemapValida(loc: string): boolean {
  try {
    const url = new URL(loc)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function esPathSitemapProhibido(pathname: string): boolean {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return RUTAS_EXCLUIDAS_SITEMAP.some((prefijo) => path === prefijo || path.startsWith(`${prefijo}/`))
}

export function esAliasSeo(pathname: string): boolean {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return ALIAS_SEO_308.some((alias) => {
    const fijo = alias.origen.split('/:')[0] ?? alias.origen
    if (alias.origen.includes('/:')) {
      return path === fijo || path.startsWith(`${fijo}/`)
    }
    return path === alias.origen
  })
}

export function pathsSitemapPiloto(): string[] {
  const rubros = SLUGS_RUBRO_SITEMAP.map((slug) => pathPublicoRubro(slug))
  const combos = SLUGS_RUBRO_SITEMAP.flatMap((slug) =>
    COMUNAS_SITEMAP_PILOTO.map((comuna) => pathPublicoCombo(slug, comuna)),
  )
  return [...rubros, ...combos]
}

function metaDePath(path: string): Pick<EntradaSitemap, 'changefreq' | 'priority'> {
  if (path === '/') return { changefreq: 'weekly', priority: 1 }
  if (path === '/proveedores') return { changefreq: 'monthly', priority: 0.6 }
  if (path === '/seguridad' || path === '/aseo' || path === '/control-de-plagas') {
    return { changefreq: 'weekly', priority: 0.9 }
  }
  if (path.split('/').filter(Boolean).length === 1) {
    return { changefreq: 'weekly', priority: 0.7 }
  }
  return { changefreq: 'weekly', priority: 0.6 }
}

export function entradasSitemap(base: string, extras: readonly string[] = []): EntradaSitemap[] {
  const vistos = new Set<string>()
  const entradas: EntradaSitemap[] = []

  for (const path of [...RUTAS_SITEMAP_FIJAS, ...extras]) {
    if (esPathSitemapProhibido(path) || esAliasSeo(path)) continue
    const loc = locSitemap(base, path)
    if (!esLocSitemapValida(loc) || vistos.has(loc)) continue
    vistos.add(loc)
    entradas.push({ loc, ...metaDePath(path) })
  }

  return entradas
}

export function escaparXml(valor: string): string {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function xmlSitemap(entradas: readonly EntradaSitemap[], lastmod: string): string {
  const fecha = lastmod.includes('T') ? lastmod : `${lastmod}T00:00:00.000Z`
  const urls = entradas
    .filter((entrada) => esLocSitemapValida(entrada.loc))
    .map(
      (entrada) => `  <url>
    <loc>${escaparXml(entrada.loc)}</loc>
    <lastmod>${escaparXml(fecha)}</lastmod>
    <changefreq>${entrada.changefreq}</changefreq>
    <priority>${entrada.priority}</priority>
  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

/**
 * Arma el XML. No tira: si algo raro pasa, quedan las URLs fijas.
 * No consulta la base: un import de Prisma/catálogo al cargar el módulo
 * es lo que hacía 500 en producción con el try/catch de sitemap.ts.
 */
export function sitemapMinimoXml(base: string, now = new Date()): string {
  const lastmod = now.toISOString()
  try {
    return xmlSitemap(entradasSitemap(base), lastmod)
  } catch {
    const locs = ['/', '/seguridad', '/aseo', '/control-de-plagas', '/proveedores'].map((path) =>
      locSitemap(base, path),
    )
    const urls = locs
      .map((loc) => `  <url><loc>${escaparXml(loc)}</loc></url>`)
      .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  }
}

export function armarSitemapXml(base: string, now = new Date()): { xml: string; locs: string[] } {
  const lastmod = now.toISOString()
  try {
    const entradas = entradasSitemap(base, pathsSitemapPiloto())
    return { xml: xmlSitemap(entradas, lastmod), locs: entradas.map((e) => e.loc) }
  } catch {
    const xml = sitemapMinimoXml(base, now)
    return { xml, locs: urlsSitemapFijas(base) }
  }
}
