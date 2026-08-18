import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModoRubro } from '@prisma/client'

import { FormularioCotizacion } from '@/components/formulario-cotizacion'
import { PasosComoFunciona } from '@/components/pasos-como-funciona'
import { SelectorCotizacion } from '@/components/selector-cotizacion'
import { parsearCampos } from '@/lib/campos'
import {
  combinacionesPublicadas,
  comunasActivas,
  rubrosActivos,
  rubrosConComunas,
} from '@/lib/catalogo'
import { OG_IMAGE } from '@/lib/metadata-publico'
import { prisma } from '@/lib/prisma'
import { copyRubro } from '@/lib/seo-contenido'
import { pathPublicoRubro, RUBROS_VENTA_PUBLICOS, slugsBdCandidatos, slugPublicoDesdeBd } from '@/lib/seo-rutas'
import { claveCombo, type RubroSelector } from '@/lib/selector-cotizacion'

export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: Promise<{ rubro: string }>
  searchParams: Promise<{ comuna?: string; audiencia?: string }>
}

function aSelector(rubro: Awaited<ReturnType<typeof rubrosConComunas>>[number]): RubroSelector {
  return {
    slug: rubro.slug,
    nombre: rubro.nombre,
    nombrePlural: rubro.nombrePlural,
    descripcion: rubro.descripcion,
    modo: rubro.modo,
    comunas: rubro.comunas.map(({ comuna }) => comuna),
  }
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
  const { comuna: comunaQuery, audiencia: audienciaQuery } = await searchParams
  const [rubro, comunas, combinaciones, filas] = await Promise.all([
    rubroPorParam(slug),
    comunasActivas(),
    combinacionesPublicadas(),
    rubrosConComunas(),
  ])

  if (!rubro) notFound()

  const copy = copyRubro(rubro.slug, rubro.nombrePlural ?? rubro.nombre, rubro.descripcion)
  const comunaPreseleccionada = comunas.some((comuna) => comuna.slug === comunaQuery)
    ? comunaQuery
    : undefined
  const publicados = combinaciones.map((fila) => claveCombo(fila.rubro, fila.comuna))
  const rubros = filas.map(aSelector)
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
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
          <nav aria-label="Migas de pan" className="mb-6 text-sm text-white/55">
            <Link href="/" className="underline-offset-4 hover:underline">
              Inicio
            </Link>
            <span aria-hidden="true"> › </span>
            <span className="text-white">{copy.h1}</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl">{copy.h1}</h1>
          <p className="mt-4 text-lg text-white/75">{copy.intro}</p>

          {rubro.modo === ModoRubro.CAPTURA ? (
            <p className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/80">
              Todavía estamos sumando empresas de este rubro. Deja tu solicitud y te avisamos.
            </p>
          ) : null}

          <div id="cotizar" className="mt-8">
            <SelectorCotizacion
              rubros={rubros}
              comunas={comunas}
              publicados={publicados}
              rubroInicial={rubro.slug}
              audienciaInicial={audienciaQuery}
              idPrefijo="selector-rubro"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
        {copy.queIncluye.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-(--color-tinta-suave)">
            {copy.queIncluye.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        <section className={copy.queIncluye.length > 0 ? 'mt-8' : undefined}>
          <h2 className="font-display text-xl">Cómo funciona</h2>
          <PasosComoFunciona listaEspera={rubro.modo === ModoRubro.CAPTURA} />
        </section>

        {comunaPreseleccionada ? (
          <section className="mt-10">
            <h2 className="font-display text-xl">Pide tu cotización</h2>
            <p className="mt-1 mb-5 text-sm text-(--color-tinta-suave)">Toma un par de minutos. Es gratis.</p>
            <FormularioCotizacion
              rubroSlug={rubro.slug}
              comunaSlug={comunaPreseleccionada}
              comunas={comunas}
              campos={parsearCampos(rubro.camposFormulario)}
              audienciaInicial={audienciaQuery}
              turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}
