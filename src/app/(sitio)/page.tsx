import Link from 'next/link'

import { PasosComoFunciona } from '@/components/pasos-como-funciona'
import { SelectorCotizacion } from '@/components/selector-cotizacion'
import { combinacionesPublicadas, comunasActivas, rubrosConComunas } from '@/lib/catalogo'
import {
  FAQ_HOME,
  combosDestacados,
  enlacesCatalogo,
  type ComboPublicado,
} from '@/lib/contenido-home'
import { claveCombo, type RubroSelector } from '@/lib/selector-cotizacion'
import { jsonLdFaq } from '@/lib/seo-contenido'

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

function enriquecerCombos(
  combinaciones: { rubro: string; comuna: string }[],
  rubros: { slug: string; nombre: string }[],
  comunas: { slug: string; nombre: string }[],
): ComboPublicado[] {
  const nombreRubro = new Map(rubros.map((r) => [r.slug, r.nombre]))
  const nombreComuna = new Map(comunas.map((c) => [c.slug, c.nombre]))
  return combinaciones.flatMap((fila) => {
    const rubroNombre = nombreRubro.get(fila.rubro)
    const comunaNombre = nombreComuna.get(fila.comuna)
    if (!rubroNombre || !comunaNombre) return []
    return [
      {
        rubroSlug: fila.rubro,
        comunaSlug: fila.comuna,
        rubroNombre,
        comunaNombre,
      },
    ]
  })
}

export default async function Inicio() {
  const [filas, comunas, combinaciones] = await Promise.all([
    rubrosConComunas(),
    comunasActivas(),
    combinacionesPublicadas(),
  ])
  const rubros = filas.map(aSelector)
  const publicados = combinaciones.map((fila) => claveCombo(fila.rubro, fila.comuna))
  const catalogo = enlacesCatalogo(
    filas.map((r) => ({ slug: r.slug, nombre: r.nombre })),
    combinaciones,
  )
  const combos = combosDestacados(enriquecerCombos(combinaciones, filas, comunas), 10)
  const comunasConPagina = new Set(combinaciones.map((c) => c.comuna)).size
  const faqLd = jsonLdFaq(FAQ_HOME)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
            <div>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                Cotiza servicios para tu casa o tu empresa
              </h1>
              <p className="mt-4 text-lg text-white/80">
                Una solicitud. Hasta tres empresas te contactan. Tú no pagas.
              </p>
            </div>
            <div id="cotizador">
              {rubros.length > 0 ? (
                <SelectorCotizacion rubros={rubros} comunas={comunas} publicados={publicados} />
              ) : (
                <p className="text-white/70">Aún no hay servicios publicados.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {rubros.length > 0 ? (
        <section className="border-t border-(--color-linea) bg-(--color-papel)">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3">
            <Cifra valor={`${rubros.length}`} etiqueta="servicios activos" />
            <Cifra
              valor={`${comunasConPagina || '—'}`}
              etiqueta="comunas con página"
            />
            <Cifra valor="Máximo 3" etiqueta="empresas te contactan" />
          </div>
        </section>
      ) : null}

      {catalogo.length > 0 ? (
        <section className="border-t border-(--color-linea) bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <h2 className="font-display text-2xl">Todos los servicios</h2>
            <p className="mt-2 text-(--color-tinta-suave)">
              Elige uno o cotiza con el selector de arriba.
            </p>
            <div className="mt-8 grid gap-10 lg:grid-cols-2">
              {catalogo.map((grupo) => (
                <div key={grupo.audiencia}>
                  <h3 className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">
                    {grupo.etiqueta}
                  </h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {grupo.items.map((item) => (
                      <li key={`${grupo.audiencia}-${item.slug}`}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="block min-h-11 truncate rounded-2xl border border-(--color-borde) bg-white px-4 py-3 text-sm font-medium transition hover:border-(--color-marca)"
                          >
                            {item.nombre}
                          </Link>
                        ) : (
                          <a
                            href="#cotizador"
                            className="block min-h-11 truncate rounded-2xl border border-dashed border-(--color-borde) px-4 py-3 text-sm text-(--color-tinta-suave) transition hover:border-(--color-marca)"
                          >
                            {item.nombre}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {combos.length > 0 ? (
        <section className="border-t border-(--color-linea) bg-(--color-papel)">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <h2 className="font-display text-2xl">Cotiza en tu comuna</h2>
            <p className="mt-2 text-(--color-tinta-suave)">
              Páginas ya publicadas. Sin URLs inventadas.
            </p>
            <ul className="mt-6 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
              {combos.map((combo) => (
                <li key={combo.href} className="mb-2 break-inside-avoid">
                  <Link
                    href={combo.href}
                    className="text-sm font-medium text-(--color-marca) underline-offset-4 hover:underline"
                  >
                    {combo.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-t border-(--color-linea) bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-3">
            {FAQ_HOME.map((item) => (
              <details
                key={item.pregunta}
                className="group rounded-2xl border border-(--color-borde) bg-(--color-papel) px-4 py-3"
              >
                <summary className="cursor-pointer list-none font-medium outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex min-h-11 items-center justify-between gap-3">
                    {item.pregunta}
                    <span className="text-(--color-tinta-suave) transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="pb-2 text-sm text-(--color-tinta-suave)">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-linea) bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl">Cómo funciona</h2>
          <PasosComoFunciona />
        </div>
      </section>

      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
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

function Cifra({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <p className="font-display text-3xl">{valor}</p>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">{etiqueta}</p>
    </div>
  )
}
