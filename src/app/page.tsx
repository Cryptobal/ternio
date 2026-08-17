import Link from 'next/link'
import { ModoRubro } from '@prisma/client'

import { rubrosActivos } from '@/lib/catalogo'

export const revalidate = 3600

export default async function Inicio() {
  const rubros = await rubrosActivos()
  const enVenta = rubros.filter((rubro) => rubro.modo === ModoRubro.VENTA)
  const enCaptura = rubros.filter((rubro) => rubro.modo === ModoRubro.CAPTURA)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
        Cuéntanos qué necesita tu empresa y te contactan proveedores de tu comuna
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-(--color-tinta-suave)">
        Cotizar es gratis. Tú dejas la solicitud una vez; las empresas interesadas te escriben
        directamente.
      </p>

      {rubros.length === 0 ? (
        <p className="mt-10 rounded-xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
          Estamos preparando el catálogo de servicios. Vuelve en un rato.
        </p>
      ) : null}

      {enVenta.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Servicios disponibles</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enVenta.map((rubro) => (
              <li key={rubro.slug}>
                <Link
                  href={`/${rubro.slug}`}
                  className="block h-full rounded-xl border border-(--color-borde) bg-white p-5 transition hover:border-(--color-marca)"
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

      {enCaptura.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Próximamente</h2>
          <p className="mt-1 text-(--color-tinta-suave)">
            Estamos sumando empresas en estos rubros. Puedes dejar tu solicitud y te avisamos.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enCaptura.map((rubro) => (
              <li key={rubro.slug}>
                <Link
                  href={`/${rubro.slug}`}
                  className="block h-full rounded-xl border border-dashed border-(--color-borde) bg-white p-5 transition hover:border-(--color-marca)"
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
    </div>
  )
}
