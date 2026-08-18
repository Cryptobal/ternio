import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModoRubro } from '@prisma/client'

import { FormularioCotizacion } from '@/components/formulario-cotizacion'
import { PasosComoFunciona } from '@/components/pasos-como-funciona'
import { SelectorComunaCta } from '@/components/selector-comuna-cta'
import { parsearCampos } from '@/lib/campos'
import { combinacionesPublicadas, comunasActivas, rubrosActivos } from '@/lib/catalogo'
import { OG_IMAGE } from '@/lib/metadata-publico'
import { prisma } from '@/lib/prisma'
import { copyRubro } from '@/lib/seo-contenido'
import { pathPublicoRubro, RUBROS_VENTA_PUBLICOS, slugsBdCandidatos, slugPublicoDesdeBd } from '@/lib/seo-rutas'
import { claveCombo } from '@/lib/selector-cotizacion'

export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: Promise<{ rubro: string }>
  searchParams: Promise<{ comuna?: string }>
}

async function rubroPorParam(slugPublico: string) {
  return prisma.rubro.findFirst({
    where: { slug: { in: slugsBdCandidatos(slugPublico) }, activo: true },
    select: {
      slug: true,
      nombre: true,
      nombrePlural: true,
      descripcion: true,
      modo: true,
      camposFormulario: true,
    },
  })
}

export async function generateStaticParams() {
  const fijos = RUBROS_VENTA_PUBLICOS.map((rubro) => ({ rubro }))
  try {
    const rubros = await rubrosActivos()
    const extra = rubros.map((rubro) => ({ rubro: slugPublicoDesdeBd(rubro.slug) }))
    const vistos = new Set<string>(fijos.map((fila) => fila.rubro))
    return [...fijos, ...extra.filter((fila) => !vistos.has(fila.rubro))]
  } catch {
    return fijos
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rubro: slug } = await params
  const rubro = await rubroPorParam(slug)
  if (!rubro) return {}
  const copy = copyRubro(rubro.slug, rubro.nombrePlural ?? rubro.nombre, rubro.descripcion)
  const path = pathPublicoRubro(rubro.slug)

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: path,
      locale: 'es_CL',
      images: [OG_IMAGE],
    },
  }
}

export default async function PaginaRubro({ params, searchParams }: Props) {
  const { rubro: slug } = await params
  const { comuna: comunaQuery } = await searchParams
  const [rubro, comunas, combinaciones] = await Promise.all([
    rubroPorParam(slug),
    comunasActivas(),
    combinacionesPublicadas(),
  ])

  if (!rubro) notFound()

  const copy = copyRubro(rubro.slug, rubro.nombrePlural ?? rubro.nombre, rubro.descripcion)
  const comunaPreseleccionada = comunas.some((comuna) => comuna.slug === comunaQuery)
    ? comunaQuery
    : undefined
  const publicados = combinaciones.map((fila) => claveCombo(fila.rubro, fila.comuna))
  const base = process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'
  const path = pathPublicoRubro(rubro.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: copy.h1,
    serviceType: rubro.nombre,
    description: copy.description,
    areaServed: { '@type': 'Country', name: 'Chile' },
    provider: { '@type': 'Organization', name: 'Ternio', url: base },
    url: `${base}${path}`,
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-(--color-tinta-suave)">
        <Link href="/" className="underline-offset-4 hover:underline">
          Inicio
        </Link>
        <span aria-hidden="true"> › </span>
        <span className="text-(--color-tinta)">{copy.h1}</span>
      </nav>

      <h1 className="font-display text-3xl sm:text-4xl">{copy.h1}</h1>
      <p className="mt-4 text-lg text-(--color-tinta-suave)">{copy.intro}</p>

      <p className="mt-6">
        <a
          href="#cotizar"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-(--color-marca) px-5 py-3 font-semibold text-white"
        >
          {copy.cta}
        </a>
      </p>
      {copy.queIncluye.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-(--color-tinta-suave)">
          {copy.queIncluye.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {rubro.modo === ModoRubro.CAPTURA ? (
        <p className="mt-4 rounded-2xl border border-(--color-ambar-borde) bg-(--color-ambar-suave) p-4 text-sm">
          Todavía estamos sumando empresas de este rubro. Deja tu solicitud y te avisamos.
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-xl">Cómo funciona</h2>
        <PasosComoFunciona listaEspera={rubro.modo === ModoRubro.CAPTURA} />
      </section>

      <div id="cotizar" className="mt-8">
        <h2 className="font-display text-xl">Elige tu comuna</h2>
        <p className="mt-1 mb-4 text-sm text-(--color-tinta-suave)">
          Región, después provincia, después comuna. Un paso a la vez. Todo Chile.
        </p>
        <SelectorComunaCta
          rubroSlug={rubro.slug}
          rubroModo={rubro.modo}
          comunas={comunas}
          publicados={publicados}
          etiquetaCta={copy.cta}
        />
      </div>

      {comunaPreseleccionada ? (
        <section className="mt-10 rounded-2xl border border-(--color-borde) bg-white p-5">
          <h2 className="font-display text-xl">Pide tu cotización</h2>
          <p className="mt-1 mb-5 text-sm text-(--color-tinta-suave)">Toma un par de minutos. Es gratis.</p>
          <FormularioCotizacion
            rubroSlug={rubro.slug}
            comunaSlug={comunaPreseleccionada}
            comunas={comunas}
            campos={parsearCampos(rubro.camposFormulario)}
            turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
          />
        </section>
      ) : null}
    </div>
  )
}
