import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { LogoProveedor } from '@/components/marca/logo-proveedor'
import { etiquetaModoCobertura, leerSnapshotCobertura, textoCobertura } from '@/lib/cobertura'
import { pathPublicoEmpresa } from '@/lib/logo-proveedor'
import { OG_IMAGE } from '@/lib/metadata-publico'
import { pathPublicoRubro } from '@/lib/seo-rutas'
import { CLASE_BOTON, CLASE_SUPERFICIE } from '@/lib/ui'
import { cargarPerfilProveedorPublico } from '@/server/proveedores-publicos'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const perfil = await cargarPerfilProveedorPublico(slug)
  if (!perfil) return { robots: { index: false, follow: false } }

  const path = pathPublicoEmpresa(perfil.slug)
  const description =
    perfil.descripcion?.trim() ||
    `${perfil.nombre} en Ternio. Cotiza servicios B2B con empresas de tu zona.`

  return {
    title: perfil.nombre,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: perfil.nombre,
      description,
      url: path,
      locale: 'es_CL',
      images: perfil.logoUrl ? [{ url: perfil.logoUrl }] : [OG_IMAGE],
    },
  }
}

export default async function PerfilEmpresa({ params }: Props) {
  const { slug } = await params
  const perfil = await cargarPerfilProveedorPublico(slug)
  if (!perfil) notFound()

  const snapshot = leerSnapshotCobertura(perfil.solicitudEspera)
  const cobertura = perfil.coberturaNacional
    ? 'Todo Chile'
    : snapshot
      ? `${etiquetaModoCobertura(snapshot.modo)} · ${textoCobertura(snapshot)}`
      : null

  const rubrosMap = new Map<string, string>()
  for (const slugRubro of snapshot?.rubros ?? []) {
    rubrosMap.set(slugRubro, slugRubro)
  }
  for (const fila of perfil.coberturas) {
    rubrosMap.set(fila.rubro.slug, fila.rubro.nombre)
  }
  const rubrosConNombre = [...rubrosMap.entries()].map(([slugRubro, nombre]) => ({
    slug: slugRubro,
    nombre,
  }))

  const base = process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'
  const path = pathPublicoEmpresa(perfil.slug)
  const ctaRubro = rubrosConNombre[0]?.slug

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: perfil.nombre,
    url: `${base}${path}`,
    description: perfil.descripcion ?? undefined,
    image: perfil.logoUrl ?? undefined,
    sameAs: perfil.sitioWeb ? [perfil.sitioWeb] : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-(--color-texto-suave)">
          <Link href="/" className="underline-offset-4 hover:underline">
            Inicio
          </Link>
          <span aria-hidden="true"> › </span>
          <span className="text-(--color-texto)">{perfil.nombre}</span>
        </nav>

        <header className="flex flex-wrap items-start gap-4">
          <LogoProveedor nombre={perfil.nombre} logoUrl={perfil.logoUrl} tamano="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl sm:text-4xl">{perfil.nombre}</h1>
            {cobertura ? (
              <p className="mt-2 text-sm text-(--color-texto-suave)">Cobertura: {cobertura}</p>
            ) : null}
            {perfil.sitioWeb ? (
              <p className="mt-2 text-sm">
                <a
                  href={perfil.sitioWeb}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  Sitio web
                </a>
              </p>
            ) : null}
          </div>
        </header>

        {perfil.descripcion ? (
          <p className={`mt-8 text-lg text-(--color-texto-suave) ${CLASE_SUPERFICIE}`}>
            {perfil.descripcion}
          </p>
        ) : null}

        {rubrosConNombre.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-xl">Servicios</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {rubrosConNombre.map((rubro) => (
                <li key={rubro.slug}>
                  <Link
                    href={pathPublicoRubro(rubro.slug)}
                    className="inline-flex min-h-11 items-center rounded-2xl border border-(--color-borde) bg-(--color-superficie) px-3 py-2 text-sm transition hover:border-(--color-boton)"
                  >
                    {rubro.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <Link href={ctaRubro ? pathPublicoRubro(ctaRubro) : '/'} className={`${CLASE_BOTON} sm:w-auto`}>
            Cotizar gratis
          </Link>
          <p className="mt-2 text-sm text-(--color-texto-suave)">
            Tú no pagas. Las empresas de tu zona te contactan si toman la solicitud.
          </p>
        </div>
      </div>
    </>
  )
}
