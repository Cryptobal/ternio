import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModoRubro } from '@prisma/client'

import { FormularioCotizacion } from '@/components/formulario-cotizacion'
import { MedidorVisita } from '@/components/medidor-embudo'
import { OtroServicio } from '@/components/otro-servicio'
import { parsearCampos } from '@/lib/campos'
import { combinacionPorSlugs, combinacionesPublicadas } from '@/lib/catalogo'

/** ISR: el contenido cambia poco y la página tiene que salir rápido. */
export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ rubro: string; comuna: string }> }

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
  const combinaciones = await combinacionesPublicadas()
  return combinaciones.map((combinacion) => ({
    rubro: combinacion.rubro,
    comuna: combinacion.comuna,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rubro, comuna } = await params
  const combinacion = await combinacionPorSlugs(rubro, comuna)
  if (!combinacion) return {}

  const titulo = `${combinacion.rubro.nombrePlural ?? combinacion.rubro.nombre} en ${combinacion.comuna.nombre}`

  return {
    title: titulo,
    description: `Cotiza ${combinacion.rubro.nombre.toLowerCase()} en ${combinacion.comuna.nombre}. Cuéntanos qué necesitas y te contactan empresas de la zona. Cotizar es gratis.`,
    alternates: { canonical: `/${rubro}/${comuna}` },
  }
}

export default async function PaginaRubroComuna({ params }: Props) {
  const { rubro: rubroSlug, comuna: comunaSlug } = await params
  const combinacion = await combinacionPorSlugs(rubroSlug, comunaSlug)

  if (!combinacion) notFound()

  const { rubro, comuna } = combinacion
  const enCaptura = rubro.modo === ModoRubro.CAPTURA
  const campos = parsearCampos(rubro.camposFormulario)

  // El contenido de la combinación manda sobre el del rubro: así cada página
  // {rubro}/{comuna} puede tener texto propio sin tocar código.
  const contenidoRubro = leerContenidoSeo(rubro.contenidoSeo)
  const contenidoCombinacion = leerContenidoSeo(combinacion.contenido)
  const intro = contenidoCombinacion.intro ?? contenidoRubro.intro ?? ''
  const porQue = contenidoCombinacion.porQue ?? contenidoRubro.porQue ?? ''

  const titulo = `${rubro.nombrePlural ?? rubro.nombre} en ${comuna.nombre}`
  const base = process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'

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
          item: `${base}/${rubro.slug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: comuna.nombre,
          item: `${base}/${rubro.slug}/${comuna.slug}`,
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
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MedidorVisita rubro={rubro.slug} comuna={comuna.slug} />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-(--color-tinta-suave)">
          <Link href="/" className="underline-offset-4 hover:underline">
            Inicio
          </Link>
          <span aria-hidden="true"> › </span>
          <Link href={`/${rubro.slug}`} className="underline-offset-4 hover:underline">
            {rubro.nombrePlural ?? rubro.nombre}
          </Link>
          <span aria-hidden="true"> › </span>
          <span className="text-(--color-tinta)">{comuna.nombre}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{titulo}</h1>
            {intro ? (
              <p className="mt-4 text-lg text-(--color-tinta-suave)">{intro}</p>
            ) : null}

            {enCaptura ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">
                  Todavía estamos sumando empresas de este rubro en {comuna.nombre}.
                </p>
                <p className="mt-1">
                  Puedes dejar tu solicitud igual: entras a la lista de espera y te avisamos
                  apenas tengamos proveedores en tu zona.
                </p>
              </div>
            ) : null}

            {porQue ? (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">
                  Cómo funciona en {comuna.nombre}
                </h2>
                <p className="mt-2 text-(--color-tinta-suave)">{porQue}</p>
                <ol className="mt-4 space-y-3 text-(--color-tinta-suave)">
                  <li>
                    <strong className="text-(--color-tinta)">1.</strong> Cuéntanos qué necesitas
                    en el formulario. No tienes que crear cuenta para empezar.
                  </li>
                  <li>
                    <strong className="text-(--color-tinta)">2.</strong> Verificamos tus datos
                    para que solo lleguen solicitudes reales a los proveedores.
                  </li>
                  <li>
                    <strong className="text-(--color-tinta)">3.</strong>{' '}
                    {enCaptura
                      ? `Te avisamos apenas haya empresas de este rubro atendiendo ${comuna.nombre}.`
                      : `Las empresas que atienden ${comuna.nombre} te contactan directamente.`}
                  </li>
                </ol>
              </section>
            ) : null}

            <div className="mt-8">
              <OtroServicio comunaSlug={comuna.slug} />
            </div>
          </div>

          <section
            id="cotizar"
            className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-xl font-semibold">
              {enCaptura ? 'Déjanos tu solicitud' : 'Pide tu cotización'}
            </h2>
            <p className="mt-1 mb-5 text-sm text-(--color-tinta-suave)">
              Toma menos de dos minutos y es gratis.
            </p>

            <FormularioCotizacion
              rubroSlug={rubro.slug}
              comunaSlug={comuna.slug}
              campos={campos}
              turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
            />
          </section>
        </div>
      </div>
    </>
  )
}
