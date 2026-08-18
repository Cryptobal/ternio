import type { Metadata } from 'next'
import Link from 'next/link'

import { FormularioListaEspera } from '@/components/formulario-lista-espera'
import { comunasActivas, rubrosActivos } from '@/lib/catalogo'

export const metadata: Metadata = {
  title: 'Para empresas proveedoras',
  description:
    'Recibe solicitudes verificadas de tus comunas y paga solo por el contacto. Sin mensualidad, sin comisión sobre el contrato.',
  alternates: { canonical: '/proveedores' },
}

export const dynamic = 'force-dynamic'

const CORREO = process.env.NEXT_PUBLIC_CONTACTO_PROVEEDORES

export default async function Proveedores() {
  const [rubros, comunas] = await Promise.all([rubrosActivos(), comunasActivas()])

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">Para empresas</p>
      <h1 className="font-display mt-3 text-4xl leading-tight">
        Recibe solicitudes verificadas de tus comunas
      </h1>
      <p className="mt-4 text-lg text-(--color-tinta-suave)">
        Pagas solo por el contacto. Sin mensualidad, sin comisión sobre el contrato.
      </p>

      <ul className="mt-10 space-y-5">
        <li className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <h2 className="font-medium">Lead verificado</h2>
          <p className="mt-1 text-(--color-tinta-suave)">
            Solo se venden solicitudes con RUT válido y teléfono confirmado. Ves etiquetas de
            verificación en la ficha antes de decidir.
          </p>
        </li>
        <li className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <h2 className="font-medium">Ficha anónima hasta el pago</h2>
          <p className="mt-1 text-(--color-tinta-suave)">
            Antes de comprar ves rubro, comuna, tamaño, plazo y verificación. Nombre, teléfono,
            correo y RUT se revelan cuando pagas.
          </p>
        </li>
        <li className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <h2 className="font-medium">Exclusivo o compartido</h2>
          <p className="mt-1 text-(--color-tinta-suave)">
            Exclusivo cierra el lead para ti. Compartido: hasta tres empresas pueden tomarlo.
            El precio baja con el tiempo: 100% las primeras 24 horas, −20% hasta 72 horas y
            −50% hasta 7 días.
          </p>
        </li>
        <li className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <h2 className="font-medium">Reposición en 48 horas</h2>
          <p className="mt-1 text-(--color-tinta-suave)">
            Si el teléfono no contesta o los datos son falsos, reclamas dentro de 48 horas. Si
            corresponde, devolvemos los créditos.
          </p>
        </li>
        <li className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <h2 className="font-medium">Packs de créditos</h2>
          <p className="mt-1 text-(--color-tinta-suave)">Próximamente.</p>
        </li>
      </ul>

      <div className="mt-10" id="lista-espera">
        {rubros.length === 0 ? (
          <p className="rounded-2xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
            Aún no podemos anotar empresas: falta el catálogo de rubros. Vuelve en un rato.
          </p>
        ) : (
          <FormularioListaEspera
            rubros={rubros.map((rubro) => ({ slug: rubro.slug, nombre: rubro.nombre }))}
            comunas={comunas}
          />
        )}
      </div>

      {CORREO ? (
        <p className="mt-6 text-sm text-(--color-tinta-suave)">
          Si prefieres, escríbenos a{' '}
          <a href={`mailto:${CORREO}`} className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
            {CORREO}
          </a>
          .
        </p>
      ) : null}

      <p className="mt-8 text-sm text-(--color-tinta-suave)">
        ¿Necesitas un servicio para tu empresa?{' '}
        <Link href="/" className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
          Cotiza gratis
        </Link>
        .
      </p>
    </article>
  )
}
