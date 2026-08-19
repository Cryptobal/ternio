import { urlPublicaSitio } from '@/lib/metadata-publico'
import { armarSitemapXml, sitemapMinimoXml } from '@/lib/sitemap-publico'
import { pathsEmpresasSitemap } from '@/server/proveedores-publicos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function basePublica(): string {
  return urlPublicaSitio()
}

function respuestaXml(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=600',
    },
  })
}

/**
 * Sitemap público. Siempre 200. Perfiles /empresa se agregan fail-soft
 * (si Prisma falla, quedan fijas + piloto).
 */
export async function GET() {
  const base = basePublica()
  try {
    let extrasEmpresas: string[] = []
    try {
      extrasEmpresas = await pathsEmpresasSitemap()
    } catch {
      extrasEmpresas = []
    }
    const { xml } = armarSitemapXml(base, new Date(), extrasEmpresas)
    return respuestaXml(xml)
  } catch {
    return respuestaXml(sitemapMinimoXml(base))
  }
}
