import Link from 'next/link'
import { ModoRubro } from '@prisma/client'

import { SelectorCotizacion } from '@/components/selector-cotizacion'
import { combinacionesPublicadas, comunasActivas, rubrosConComunas } from '@/lib/catalogo'
import { atajosHome } from '@/lib/seo-contenido'
import { pathPublicoRubro } from '@/lib/seo-rutas'
import { claveCombo, type RubroSelector } from '@/lib/selector-cotizacion'

export const dynamic = 'force-dynamic'

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

export default async function Inicio() {
  const [filas, comunas, combinaciones] = await Promise.all([
    rubrosConComunas(),
    comunasActivas(),
    combinacionesPublicadas(),
  ])
  const rubros = filas.map(aSelector)
  const publicados = combinaciones.map((fila) => claveCombo(fila.rubro, fila.comuna))
  const enVenta = rubros.filter((rubro) => rubro.modo === ModoRubro.VENTA)

  return (
    <div>
      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Cotiza servicios para tu empresa
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Una solicitud. Hasta tres empresas te contactan. Tú no pagas.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {atajosHome().map((atajo) => (
              <li key={atajo.href}>
                <Link
                  href={atajo.href}
                  className="inline-flex min-h-11 items-center rounded-full bg-(--color-ambar) px-4 py-2 font-semibold text-(--color-tinta)"
                >
                  {atajo.etiqueta}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 text-(--color-tinta)">
            {rubros.length > 0 ? (
              <SelectorCotizacion rubros={rubros} comunas={comunas} publicados={publicados} />
            ) : (
              <p className="rounded-2xl bg-white p-5 text-(--color-tinta-suave)">
                Aún no hay servicios publicados.
              </p>
            )}
          </div>
        </div>
      </section>

      {enVenta.length > 0 ? (
        <section className="mx-auto w-full max-w-xl px-4 py-12">
          <h2 className="font-display text-2xl">Servicios</h2>
          <ul className="mt-5 grid gap-3">
            {enVenta.map((rubro) => (
              <li key={rubro.slug}>
                <Link
                  href={pathPublicoRubro(rubro.slug)}
                  className="block rounded-3xl border border-(--color-borde) bg-white p-5 shadow-[0_12px_32px_-20px_rgb(14_27_44/0.2)] transition hover:-translate-y-0.5"
                >
                  <span className="font-medium">{rubro.nombrePlural ?? rubro.nombre}</span>
                  <span className="mt-1 block text-sm text-(--color-tinta-suave)">
                    {rubro.descripcion}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-t border-(--color-linea) bg-white">
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <h2 className="font-display text-2xl">Cómo funciona</h2>
          <ol className="mt-6 grid gap-4">
            <li>
              <h3 className="font-medium">1. Cuéntanos qué necesitas</h3>
              <p className="mt-1 text-sm text-(--color-tinta-suave)">
                Elige comuna y responde unas preguntas. Sin cuenta para empezar.
              </p>
            </li>
            <li>
              <h3 className="font-medium">2. Confirmamos RUT y teléfono</h3>
              <p className="mt-1 text-sm text-(--color-tinta-suave)">
                Así las empresas reciben solo solicitudes reales.
              </p>
            </li>
            <li>
              <h3 className="font-medium">3. Te contactan</h3>
              <p className="mt-1 text-sm text-(--color-tinta-suave)">
                Máximo tres empresas. Tú eliges.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <h2 className="font-display text-2xl">¿Vendes servicios?</h2>
          <p className="mt-2 text-white/80">
            Recibe solicitudes de tus comunas. Pagas solo el contacto.
          </p>
          <Link
            href="/proveedores"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-(--color-ambar) px-5 py-3 font-semibold text-(--color-tinta)"
          >
            Soy proveedor
          </Link>
        </div>
      </section>
    </div>
  )
}
