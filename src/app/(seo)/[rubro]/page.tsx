import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModoRubro } from '@prisma/client'

import { FormularioCotizacion } from '@/components/formulario-cotizacion'
import { parsearCampos } from '@/lib/campos'
import { prisma } from '@/lib/prisma'
import { rubrosActivos } from '@/lib/catalogo'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ rubro: string }> }

async function rubroConComunas(slug: string) {
  return prisma.rubro.findFirst({
    where: { slug, activo: true },
    select: {
      slug: true,
      nombre: true,
      nombrePlural: true,
      descripcion: true,
      modo: true,
      camposFormulario: true,
      comunas: {
        where: { activa: true, comuna: { activa: true } },
        orderBy: { comuna: { orden: 'asc' } },
        select: { comuna: { select: { slug: true, nombre: true, region: true } } },
      },
    },
  })
}

export async function generateStaticParams() {
  const rubros = await rubrosActivos()
  return rubros.map((rubro) => ({ rubro: rubro.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rubro: slug } = await params
  const rubro = await rubroConComunas(slug)
  if (!rubro) return {}

  return {
    title: rubro.nombrePlural ?? rubro.nombre,
    description: rubro.descripcion ?? undefined,
    alternates: { canonical: `/${rubro.slug}` },
  }
}

export default async function PaginaRubro({ params }: Props) {
  const { rubro: slug } = await params
  const rubro = await rubroConComunas(slug)

  if (!rubro) notFound()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-(--color-tinta-suave)">
        <Link href="/" className="underline-offset-4 hover:underline">
          Inicio
        </Link>
        <span aria-hidden="true"> › </span>
        <span className="text-(--color-tinta)">{rubro.nombrePlural ?? rubro.nombre}</span>
      </nav>

      <h1 className="font-display text-3xl sm:text-4xl">
        {rubro.nombrePlural ?? rubro.nombre}
      </h1>
      {rubro.descripcion ? (
        <p className="mt-3 text-lg text-(--color-tinta-suave)">{rubro.descripcion}</p>
      ) : null}

      {rubro.modo === ModoRubro.CAPTURA ? (
        <p className="mt-4 rounded-2xl border border-(--color-ambar-borde) bg-(--color-ambar-suave) p-4 text-sm text-(--color-tinta)">
          Todavía estamos sumando empresas de este rubro. Deja tu solicitud y te avisamos apenas
          tengamos proveedores en tu zona.
        </p>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
        <div>
          <h2 className="font-display text-xl">Elige tu comuna</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {rubro.comunas.map(({ comuna }) => (
              <li key={comuna.slug}>
                <Link
                  href={`/${rubro.slug}/${comuna.slug}`}
                  className="block rounded-2xl border border-(--color-borde) bg-white px-4 py-3 shadow-sm transition hover:border-(--color-marca)"
                >
                  <span className="font-medium">{comuna.nombre}</span>
                  <span className="block text-sm text-(--color-tinta-suave)">{comuna.region}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <section
          id="cotizar"
          className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="font-display text-xl">Pide tu cotización</h2>
          <p className="mt-1 mb-5 text-sm text-(--color-tinta-suave)">
            Empieza por la comuna. El cotizador por pasos necesita JavaScript.
          </p>
          <FormularioCotizacion
            rubroSlug={rubro.slug}
            comunas={rubro.comunas.map(({ comuna }) => ({
              slug: comuna.slug,
              nombre: comuna.nombre,
            }))}
            campos={parsearCampos(rubro.camposFormulario)}
            turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
          />
        </section>
      </div>
    </div>
  )
}
