import type { Metadata } from 'next'
import Link from 'next/link'

import { SelectorPrecios } from '@/components/sitio/selector-precios'
import { rubrosActivos } from '@/lib/catalogo'
import {
  HERO_PRECIOS,
  RAZONES_COMPRADOR,
  etiquetaDesde,
  precioDesdeMinimo,
  rubrosConPrecioPublico,
} from '@/lib/contenido-precios'
import { CLASE_BOTON, CLASE_BOTON_SUAVE, CLASE_SUPERFICIE } from '@/lib/ui'

export const metadata: Metadata = {
  title: 'Precios',
  description:
    'Si cotizas, no pagas. Si vendes, pagas por contacto. Sin mensualidad ni comisión al cierre.',
  alternates: { canonical: '/precios' },
}

export const dynamic = 'force-dynamic'

export default async function PreciosPage() {
  let rubros: ReturnType<typeof rubrosConPrecioPublico> = []
  try {
    rubros = rubrosConPrecioPublico(await rubrosActivos())
  } catch {
    rubros = []
  }
  const minimo = precioDesdeMinimo(rubros)
  const desde = etiquetaDesde(minimo)

  return (
    <article>
      <section className="bg-(--color-hero) text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{HERO_PRECIOS.titulo}</h1>
          <p className="mt-4 text-lg text-white/80">{HERO_PRECIOS.bajada}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${CLASE_SUPERFICIE} border-(--color-verde)/40 bg-(--color-verde-suave)`}>
            <p className="font-eyebrow text-[0.7rem] text-(--color-verde)">Si cotizas</p>
            <p className="font-display mt-2 text-5xl text-(--color-tinta)">$0</p>
            <ul className="mt-4 grid gap-2 text-sm text-(--color-tinta)">
              {RAZONES_COMPRADOR.map((razon) => (
                <li key={razon} className="flex gap-2">
                  <span aria-hidden="true" className="text-(--color-verde)">
                    ·
                  </span>
                  {razon}
                </li>
              ))}
            </ul>
          </div>

          <div className={CLASE_SUPERFICIE}>
            <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Si vendes</p>
            <p className="font-display mt-2 text-3xl sm:text-4xl">{desde}</p>
            <p className="mt-3 text-sm text-(--color-texto-suave)">
              Sin mensualidad. Compras créditos y los gastas solo en los contactos que te sirven.
            </p>
            <Link href="/proveedores" className={`${CLASE_BOTON} mt-5`}>
              Crear cuenta de proveedor
            </Link>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl">Precios por contacto</h2>
          <p className="mt-2 text-(--color-texto-suave)">
            Elige el servicio. El precio baja con la antigüedad del lead.
          </p>
          <div className="mt-6">
            <SelectorPrecios rubros={rubros} />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#cotizador" className={CLASE_BOTON}>
            Pedir cotización gratis
          </Link>
          <Link href="/como-funciona" className={CLASE_BOTON_SUAVE}>
            Cómo funciona
          </Link>
        </div>
      </section>
    </article>
  )
}
