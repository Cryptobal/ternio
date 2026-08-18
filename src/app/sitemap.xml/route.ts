import { urlPublicaSitio } from '@/lib/metadata-publico'
import { armarSitemapXml, sitemapMinimoXml } from '@/lib/sitemap-publico'

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
 * Sitemap público. Este route handler (no `app/sitemap.ts`) controla el
 * status: siempre 200. El XML se arma en módulos sin Prisma.
 */
export async function GET() {
  const base = basePublica()
  try {
    return respuestaXml(armarSitemapXml(base).xml)
  } catch {
    return respuestaXml(sitemapMinimoXml(base))
  }
}
