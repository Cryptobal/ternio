import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { fechaLegible, listarPosts, pathCtaPost, postPorSlug } from '@/lib/blog'
import { OG_IMAGE, URL_SITIO_CANONICA } from '@/lib/metadata-publico'
import { copyRubro } from '@/lib/seo-contenido'
import { pathPublicoRubro } from '@/lib/seo-rutas'
import { CLASE_BOTON_AMBAR } from '@/lib/ui'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return listarPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = postPorSlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: post.path },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: post.path,
      locale: 'es_CL',
      publishedTime: `${post.date}T12:00:00-04:00`,
      modifiedTime: `${post.date}T12:00:00-04:00`,
      authors: ['Ternio'],
      images: [OG_IMAGE],
    },
  }
}

export default async function PaginaArticulo({ params }: Props) {
  const { slug } = await params
  const post = postPorSlug(slug)
  if (!post) notFound()

  const copy = post.rubro ? copyRubro(post.rubro, post.rubro, null) : null
  const pathLanding = post.rubro ? pathPublicoRubro(post.rubro) : '/'
  const pathCta = pathCtaPost(post)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: 'es-CL',
      author: { '@type': 'Organization', name: 'Ternio', url: URL_SITIO_CANONICA },
      publisher: { '@type': 'Organization', name: 'Ternio', url: URL_SITIO_CANONICA },
      mainEntityOfPage: { '@type': 'WebPage', '@id': post.canonical },
      url: post.canonical,
      keywords: post.keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: URL_SITIO_CANONICA },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${URL_SITIO_CANONICA}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.canonical },
      ],
    },
  ]

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        <header className="bg-(--color-tinta) text-white">
          <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
            <nav aria-label="Migas de pan" className="mb-6 text-sm text-white/55">
              <Link href="/" className="underline-offset-4 hover:underline">
                Inicio
              </Link>
              <span aria-hidden="true"> › </span>
              <Link href="/blog" className="underline-offset-4 hover:underline">
                Blog
              </Link>
              <span aria-hidden="true"> › </span>
              <span className="text-white">{post.title}</span>
            </nav>
            <p className="font-eyebrow text-xs text-white/55">
              {fechaLegible(post.date)}
              <span aria-hidden="true"> · </span>
              Ternio
            </p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-lg text-white/75">{post.description}</p>
          </div>
        </header>

        <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
          <div
            className="prosa-blog text-base leading-relaxed text-(--color-tinta) [&_a]:underline [&_a]:underline-offset-4 [&_em]:italic [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mt-4 [&_p]:text-(--color-tinta-suave) [&_strong]:font-semibold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <aside className="mt-10 rounded-2xl bg-(--color-tinta) p-6 text-white">
            <h2 className="font-display text-xl">
              {copy ? copy.cta.replace(/^Pedir /, 'Pide ') : 'Pide tu cotización'}
            </h2>
            <p className="mt-2 text-sm text-white/75">
              Una solicitud. Hasta tres empresas te contactan. Tú no pagas. Ternio no cobra al que cotiza.
            </p>
            <Link href={pathCta} className={`${CLASE_BOTON_AMBAR} mt-5`}>
              {copy?.cta ?? 'Pedir cotización'}
            </Link>
            {post.rubro ? (
              <p className="mt-3 text-xs text-white/55">
                Te lleva a{' '}
                <Link href={pathLanding} className="underline underline-offset-4">
                  {pathLanding}
                </Link>
                .
              </p>
            ) : null}
          </aside>
        </div>
      </article>
    </div>
  )
}
