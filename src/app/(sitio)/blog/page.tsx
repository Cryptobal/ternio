import type { Metadata } from 'next'
import Link from 'next/link'

import { fechaLegible, listarPosts } from '@/lib/blog'
import { OG_IMAGE } from '@/lib/metadata-publico'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guías prácticas para cotizar servicios en Chile: precios, qué pedir y cómo comparar. Sin cuenta. Tú no pagas.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog',
    description:
      'Guías prácticas para cotizar servicios en Chile: precios, qué pedir y cómo comparar. Sin cuenta. Tú no pagas.',
    url: '/blog',
    locale: 'es_CL',
    images: [OG_IMAGE],
  },
}

export default function PaginaBlog() {
  const posts = listarPosts()

  return (
    <div>
      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
          <nav aria-label="Migas de pan" className="mb-6 text-sm text-white/55">
            <Link href="/" className="underline-offset-4 hover:underline">
              Inicio
            </Link>
            <span aria-hidden="true"> › </span>
            <span className="text-white">Blog</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-4xl">Blog</h1>
          <p className="mt-4 text-lg text-white/75">
            Cómo cotizar sin adivinar. Textos nuestros, sin cifras inventadas ni “+1000 empresas”.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
        {posts.length === 0 ? (
          <p className="text-(--color-tinta-suave)">Todavía no hay artículos publicados.</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.slug}>
                <p className="font-eyebrow text-xs text-(--color-tinta-suave)">{fechaLegible(post.date)}</p>
                <h2 className="mt-1 font-display text-xl">
                  <Link href={post.path} className="underline-offset-4 hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-(--color-tinta-suave)">{post.description}</p>
                <p className="mt-2">
                  <Link href={post.path} className="text-sm font-medium underline-offset-4 hover:underline">
                    Leer
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
