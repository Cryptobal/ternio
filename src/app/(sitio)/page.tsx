import Link from 'next/link'

import { PasosComoFunciona } from '@/components/pasos-como-funciona'
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

  return (
    <div>
      <section className="bg-(--color-tinta) text-white">
        <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Cotiza servicios para tu casa o tu empresa
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Una solicitud. Hasta tres empresas te contactan. Tú no pagas.
          </p>

          <div className="mt-8">
            {rubros.length > 0 ? (
              <SelectorCotizacion rubros={rubros} comunas={comunas} publicados={publicados} />
            ) : (
              <p className="text-white/70">Aún no hay servicios publicados.</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-linea) bg-white">
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <h2 className="font-display text-2xl">Cómo funciona</h2>
          <PasosComoFunciona />
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
