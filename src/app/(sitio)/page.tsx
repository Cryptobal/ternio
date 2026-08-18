import Link from 'next/link'
import { ModoRubro } from '@prisma/client'

import { SelectorCotizacion } from '@/components/selector-cotizacion'
import { combinacionesPublicadas, comunasActivas, rubrosConComunas } from '@/lib/catalogo'
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
  const enCaptura = rubros.filter((rubro) => rubro.modo === ModoRubro.CAPTURA)
  const rubroConComuna = rubros.find((rubro) => rubro.comunas.length > 0)
  const rubroOtroServicio = rubroConComuna?.slug ?? rubros[0]?.slug
  const anclaOtroServicio = rubroConComuna
    ? `/${rubroConComuna.comunas[0]!.slug}#otro-servicio`
    : ''

  return (
    <div>
      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
          <p className="font-eyebrow text-[0.7rem] text-(--color-ambar)">
            Marketplace de servicios · Chile
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">
            Cotiza servicios{' '}
            <span className="rounded-md bg-(--color-ambar-suave) px-1.5 text-(--color-tinta)">
              para tu empresa
            </span>
            .
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Una sola solicitud y hasta tres empresas verificadas te contactan y publican su
            propuesta. Gratis, sin registro y sin llamadas de más.
          </p>

          <div className="mt-8 text-(--color-tinta)">
            {rubros.length > 0 ? (
              <SelectorCotizacion rubros={rubros} comunas={comunas} publicados={publicados} />
            ) : null}
          </div>

          <ul className="mt-5 flex flex-wrap gap-2 text-sm">
            {['RUT verificado', 'Teléfono verificado', 'Máximo 3 empresas te contactan'].map(
              (chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/85"
                >
                  {chip}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {rubros.length === 0 ? (
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <p className="rounded-2xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave) shadow-sm">
            Aún no hay servicios publicados. Vuelve en un rato.
          </p>
        </div>
      ) : (
        <>
          <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Así funciona una solicitud</h2>
              <span className="font-eyebrow rounded-full bg-(--color-ambar-suave) px-2.5 py-1 text-[0.65rem] text-(--color-tinta)">
                Ejemplo
              </span>
            </div>
            <article className="mt-5 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm sm:p-6">
              <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">
                Folio TN-1042
              </p>
              <p className="mt-1 font-medium">Guardias de seguridad en Las Condes</p>
              <ol className="mt-5 space-y-4">
                <li className="flex gap-3">
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-(--color-verde)" />
                  <div>
                    <p className="font-medium">Una empresa tomó la solicitud</p>
                    <p className="text-sm text-(--color-tinta-suave)">
                      Recibió la ficha y se contactó contigo.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-(--color-verde)" />
                  <div>
                    <p className="font-medium">Publicó su propuesta</p>
                    <p className="text-sm text-(--color-tinta-suave)">
                      Quedó lista para que la compares.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-(--color-ambar)" />
                  <div>
                    <p className="font-medium">1 cupo libre de 3</p>
                    <p className="text-sm text-(--color-tinta-suave)">
                      Hasta tres empresas pueden tomar la misma solicitud.
                    </p>
                    <div className="mt-2 flex gap-1.5" aria-hidden="true">
                      <span className="h-2 w-16 rounded-full bg-(--color-marca)" />
                      <span className="h-2 w-16 rounded-full bg-(--color-marca)" />
                      <span className="h-2 w-16 rounded-full bg-(--color-linea)" />
                    </div>
                  </div>
                </li>
              </ol>
            </article>
          </section>

          <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:pb-16">
            <h2 className="font-display text-2xl">Servicios</h2>
            {enVenta.length > 0 ? (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enVenta.map((rubro) => (
                  <li key={rubro.slug}>
                    <Link
                      href={`/${rubro.slug}`}
                      className="block h-full rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm transition hover:border-(--color-marca)"
                    >
                      <span className="font-medium">{rubro.nombrePlural ?? rubro.nombre}</span>
                      <span className="mt-1 block text-sm text-(--color-tinta-suave)">
                        {rubro.descripcion}
                      </span>
                      <span className="font-eyebrow mt-4 block text-[0.65rem] text-(--color-tinta-suave)">
                        {rubro.comunas.length} {rubro.comunas.length === 1 ? 'comuna' : 'comunas'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {enCaptura.length > 0 || rubroOtroServicio ? (
              <div className="mt-8">
                {enCaptura.length > 0 ? (
                  <p className="text-sm font-medium text-(--color-tinta-suave)">Abriendo pronto:</p>
                ) : null}
                <ul className="mt-3 flex flex-wrap gap-2">
                  {enCaptura.map((rubro) => (
                    <li key={rubro.slug}>
                      <Link
                        href={`/${rubro.slug}`}
                        className="inline-flex min-h-11 items-center rounded-full border border-dashed border-(--color-borde) bg-white px-3 py-2 text-sm"
                      >
                        {rubro.nombrePlural ?? rubro.nombre}
                      </Link>
                    </li>
                  ))}
                  {rubroOtroServicio ? (
                    <li>
                      <Link
                        href={`/${rubroOtroServicio}${anclaOtroServicio}`}
                        className="inline-flex min-h-11 items-center rounded-full border border-(--color-marca) px-3 py-2 text-sm font-medium text-(--color-marca)"
                      >
                        Otro servicio →
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="border-t border-(--color-linea) bg-white">
            <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
              <h2 className="font-display text-2xl">Cómo funciona</h2>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                <li className="rounded-2xl border border-(--color-borde) p-5">
                  <p className="font-eyebrow text-[0.65rem] text-(--color-tinta-suave)">01</p>
                  <h3 className="mt-2 font-medium">Cuéntanos qué necesitas</h3>
                  <p className="mt-1 text-sm text-(--color-tinta-suave)">
                    Toma un par de minutos y no tienes que crear cuenta para empezar.
                  </p>
                </li>
                <li className="rounded-2xl border border-(--color-borde) p-5">
                  <p className="font-eyebrow text-[0.65rem] text-(--color-tinta-suave)">02</p>
                  <h3 className="mt-2 font-medium">Verificamos tu solicitud</h3>
                  <p className="mt-1 text-sm text-(--color-tinta-suave)">
                    Confirmamos el RUT con dígito verificador y el teléfono con un código. Así
                    las empresas reciben solo solicitudes reales.
                  </p>
                </li>
                <li className="rounded-2xl border border-(--color-borde) p-5">
                  <p className="font-eyebrow text-[0.65rem] text-(--color-tinta-suave)">03</p>
                  <h3 className="mt-2 font-medium">Compara y elige</h3>
                  <p className="mt-1 text-sm text-(--color-tinta-suave)">
                    Hasta tres empresas te contactan. Las que quieran publican su propuesta y tú
                    comparas.
                  </p>
                </li>
              </ol>
            </div>
          </section>
        </>
      )}

      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <h2 className="font-display text-2xl">¿Vendes servicios?</h2>
            <p className="mt-2 max-w-xl text-white/80">
              Recibe solicitudes verificadas de tus comunas y paga solo por el contacto. Sin
              mensualidad, sin comisión sobre el contrato.
            </p>
          </div>
          <Link
            href="/proveedores"
            className="inline-flex min-h-11 items-center rounded-2xl bg-(--color-ambar) px-5 py-3 font-semibold text-(--color-tinta)"
          >
            Soy proveedor
          </Link>
        </div>
      </section>
    </div>
  )
}
