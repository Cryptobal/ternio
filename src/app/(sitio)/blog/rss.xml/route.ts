import { listarPosts } from '@/lib/blog'
import { escaparXml } from '@/lib/sitemap-publico'
import { urlPublicaSitio } from '@/lib/metadata-publico'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function rssVacio(base: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog de Ternio</title>
    <link>${escaparXml(`${base}/blog`)}</link>
    <description>Guías para cotizar servicios en Chile. Tú no pagas.</description>
    <language>es-cl</language>
  </channel>
</rss>
`
}

export async function GET() {
  const base = urlPublicaSitio()
  try {
    const posts = listarPosts()
    const items = posts
      .map((post) => {
        const link = `${base}${post.path}`
        return `    <item>
      <title>${escaparXml(post.title)}</title>
      <link>${escaparXml(link)}</link>
      <guid>${escaparXml(link)}</guid>
      <pubDate>${escaparXml(new Date(`${post.date}T12:00:00-04:00`).toUTCString())}</pubDate>
      <description>${escaparXml(post.description)}</description>
    </item>`
      })
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog de Ternio</title>
    <link>${escaparXml(`${base}/blog`)}</link>
    <description>Guías para cotizar servicios en Chile. Tú no pagas.</description>
    <language>es-cl</language>
${items}
  </channel>
</rss>
`
    return new Response(xml, {
      status: 200,
      headers: {
        'content-type': 'application/rss+xml; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=600',
      },
    })
  } catch {
    return new Response(rssVacio(base), {
      status: 200,
      headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
    })
  }
}
