import Link from 'next/link'

import { PasosComoFunciona } from '@/components/pasos-como-funciona'
import { SelectorCotizacion } from '@/components/selector-cotizacion'
import { CatalogoHome } from '@/components/sitio/catalogo-home'
import { combinacionesPublicadas, comunasActivas, rubrosConComunas } from '@/lib/catalogo'
import {
  CATALOGO_HOME,
  FAQ_HOME,
  PROMESAS_HOME,
  combosDestacados,
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
    audiencias: rubro.audiencias,
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
  const conPagina = new Set(combinaciones.map((c) => c.rubro))
  const itemsCatalogo = filas.map((r) => ({
    slug: r.slug,
    nombre: r.nombre,
    modo: r.modo,
    audiencias: r.audiencias,
    href: conPagina.has(r.slug) ? `/${r.slug}` : null,
  }))
  const combos = combosDestacados(enriquecerCombos(combinaciones, filas, comunas), 10)
  const faqLd = jsonLdFaq(FAQ_HOME)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <section className="bg-(--color-hero) text-white">
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

      <section className="border-t border-(--color-linea) bg-(--color-fondo)">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3">
          {PROMESAS_HOME.map((promesa) => (
            <div key={promesa.titulo}>
              <p className="font-display text-xl sm:text-2xl">{promesa.titulo}</p>
              <p className="mt-2 text-sm text-(--color-texto-suave)">{promesa.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {itemsCatalogo.length > 0 ? (
        <section id="servicios" className="border-t border-(--color-linea) bg-(--color-superficie)">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <h2 className="font-display text-2xl">{CATALOGO_HOME.titulo}</h2>
            <p className="mt-2 text-(--color-texto-suave)">{CATALOGO_HOME.bajada}</p>
            <div className="mt-8">
              <CatalogoHome rubros={itemsCatalogo} notaEspera={CATALOGO_HOME.notaEspera} />
            </div>
          </div>
        </section>
      ) : null}

      {combos.length > 0 ? (
        <section className="border-t border-(--color-linea) bg-(--color-fondo)">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <h2 className="font-display text-2xl">Cotiza en tu comuna</h2>
            <p className="mt-2 text-(--color-texto-suave)">
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

      <section className="border-t border-(--color-linea) bg-(--color-superficie)">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-3">
            {FAQ_HOME.map((item) => (
              <details
                key={item.pregunta}
                className="group rounded-2xl border border-(--color-borde) bg-(--color-fondo) px-4 py-3"
              >
                <summary className="cursor-pointer list-none font-medium outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex min-h-11 items-center justify-between gap-3">
                    {item.pregunta}
                    <span className="text-(--color-texto-suave) transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="pb-2 text-sm text-(--color-texto-suave)">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-linea) bg-(--color-superficie)">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl">Cómo funciona</h2>
          <PasosComoFunciona />
        </div>
      </section>

      <section className="bg-(--color-hero) text-white">
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
