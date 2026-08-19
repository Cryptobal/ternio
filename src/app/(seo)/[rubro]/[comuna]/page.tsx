import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModoRubro } from '@prisma/client'

import { FaqRubro } from '@/components/faq-rubro'
import { FormularioCotizacion } from '@/components/formulario-cotizacion'
import { MedidorVisita } from '@/components/medidor-embudo'
import { OtroServicio } from '@/components/otro-servicio'
import { PasosComoFunciona } from '@/components/pasos-como-funciona'
import { parsearCampos } from '@/lib/campos'
import { combinacionPorSlugs, combinacionesPublicadas } from '@/lib/catalogo'
import { OG_IMAGE } from '@/lib/metadata-publico'
import { copyCombo, jsonLdFaq } from '@/lib/seo-contenido'
import { pathPublicoCombo, pathPublicoRubro, slugPublicoDesdeBd } from '@/lib/seo-rutas'

/** ISR: el contenido cambia poco y la página tiene que salir rápido. */
export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: Promise<{ rubro: string; comuna: string }>
  searchParams: Promise<{ audiencia?: string }>
}

type ContenidoSeo = { intro?: string; porQue?: string }

function leerContenidoSeo(valor: unknown): ContenidoSeo {
  if (!valor || typeof valor !== 'object') return {}
  const objeto = valor as Record<string, unknown>
  return {
    intro: typeof objeto.intro === 'string' ? objeto.intro : undefined,
    porQue: typeof objeto.porQue === 'string' ? objeto.porQue : undefined,
  }
}

export async function generateStaticParams() {
  try {
    const combinaciones = await combinacionesPublicadas()
    return combinaciones
      .map((combinacion) => ({
        rubro: slugPublicoDesdeBd(combinacion.rubro),
        comuna: combinacion.comuna,
      }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rubro, comuna } = await params
  const combinacion = await combinacionPorSlugs(rubro, comuna)
  if (!combinacion) return {}

  const copy = copyCombo({
    slugBd: combinacion.rubro.slug,
    nombreRubro: combinacion.rubro.nombre,
    nombrePlural: combinacion.rubro.nombrePlural ?? combinacion.rubro.nombre,
    comuna: combinacion.comuna.nombre,
    region: combinacion.comuna.region,
    provincia: combinacion.comuna.provincia,
  })
  const path = pathPublicoCombo(combinacion.rubro.slug, combinacion.comuna.slug)

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

export default async function PaginaRubroComuna({ params, searchParams }: Props) {
  const { rubro: rubroSlug, comuna: comunaSlug } = await params
  const { audiencia: audienciaQuery } = await searchParams
  const combinacion = await combinacionPorSlugs(rubroSlug, comunaSlug)

  if (!combinacion) notFound()

  const { rubro, comuna } = combinacion
  const enCaptura = rubro.modo === ModoRubro.CAPTURA
  const campos = parsearCampos(rubro.camposFormulario)

  // El contenido de la combinación manda sobre el del rubro: así cada página
  // {rubro}/{comuna} puede tener texto propio sin tocar código.
  const generado = copyCombo({
    slugBd: rubro.slug,
    nombreRubro: rubro.nombre,
    nombrePlural: rubro.nombrePlural ?? rubro.nombre,
    comuna: comuna.nombre,
    region: comuna.region,
    provincia: comuna.provincia,
  })
  const contenidoRubro = leerContenidoSeo(rubro.contenidoSeo)
  const contenidoCombinacion = leerContenidoSeo(combinacion.contenido)
  const intro = contenidoCombinacion.intro ?? generado.intro
  const porQue = contenidoCombinacion.porQue ?? contenidoRubro.porQue ?? generado.porQue

  const titulo = generado.h1
  const base = process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'
  const pathRubro = pathPublicoRubro(rubro.slug)
  const pathCombo = pathPublicoCombo(rubro.slug, comuna.slug)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: base },
        {
          '@type': 'ListItem',
          position: 2,
          name: rubro.nombrePlural ?? rubro.nombre,
          item: `${base}${pathRubro}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: comuna.nombre,
          item: `${base}${pathCombo}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: titulo,
      serviceType: rubro.nombre,
      description: rubro.descripcion ?? intro,
      areaServed: {
        '@type': 'City',
        name: comuna.nombre,
        containedInPlace: { '@type': 'AdministrativeArea', name: comuna.region },
      },
      provider: { '@type': 'Organization', name: 'Ternio', url: base },
    },
    ...(generado.faq.length > 0 ? [jsonLdFaq(generado.faq)] : []),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MedidorVisita rubro={rubro.slug} comuna={comuna.slug} />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-(--color-texto-suave)">
          <Link href="/" className="underline-offset-4 hover:underline">
            Inicio
          </Link>
          <span aria-hidden="true"> › </span>
          <Link href={pathRubro} className="underline-offset-4 hover:underline">
            {rubro.nombrePlural ?? rubro.nombre}
          </Link>
          <span aria-hidden="true"> › </span>
          <span className="text-(--color-texto)">{comuna.nombre}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            <h1 className="font-display text-3xl sm:text-4xl">{titulo}</h1>
            {intro ? (
              <p className="mt-4 text-lg text-(--color-texto-suave)">{intro}</p>
            ) : null}

            {enCaptura ? (
              <div className="mt-6 rounded-2xl border border-(--color-ambar-borde) bg-(--color-ambar-suave) p-4 text-sm text-(--color-texto)">
                <p className="font-medium">
                  Todavía estamos sumando empresas de este rubro en {comuna.nombre}.
                </p>
                <p className="mt-1">
                  Puedes dejar tu solicitud igual: entras a la lista de espera y te avisamos
                  apenas tengamos proveedores en tu zona.
                </p>
              </div>
            ) : null}
          </div>

          <section
            id="cotizar"
            className="rounded-2xl border border-(--color-borde) bg-(--color-superficie) p-5 shadow-sm sm:p-6 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          >
            <h2 className="font-display text-xl">
              {enCaptura ? 'Déjanos tu solicitud' : 'Pide tu cotización'}
            </h2>
            <p className="mt-1 mb-5 text-sm text-(--color-texto-suave)">
              Toma menos de dos minutos y es gratis.
            </p>

            <FormularioCotizacion
              rubroSlug={rubro.slug}
              comunaSlug={comuna.slug}
              campos={campos}
              audienciasRubro={rubro.audiencias}
              audienciaInicial={audienciaQuery}
              turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
            />
          </section>

          <div className="lg:col-start-1 lg:row-start-2">
            {porQue ? (
              <section>
                <h2 className="font-display text-xl">
                  Cómo funciona en {comuna.nombre}
                </h2>
                <p className="mt-2 text-(--color-texto-suave)">{porQue}</p>
                <PasosComoFunciona comuna={comuna.nombre} listaEspera={enCaptura} />
              </section>
            ) : null}

            <FaqRubro items={generado.faq} />

            <div id="otro-servicio" className="mt-8">
              <OtroServicio comunaSlug={comuna.slug} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
