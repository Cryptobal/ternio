import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Para empresas proveedoras',
  description:
    'Recibe solicitudes verificadas de tus comunas y paga solo por el contacto. Sin mensualidad, sin comisión sobre el contrato.',
  alternates: { canonical: '/proveedores' },
}

const CORREO = process.env.NEXT_PUBLIC_CONTACTO_PROVEEDORES

export default function Proveedores() {
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

      {CORREO ? (
        <div className="mt-10 rounded-2xl bg-(--color-tinta) p-6 text-white">
          <h2 className="font-display text-2xl">¿Quieres entrar?</h2>
          <p className="mt-2 text-white/80">
            Escríbenos y te avisamos cuando se abra el onboarding.
          </p>
          <a
            href={`mailto:${CORREO}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-(--color-ambar) px-5 py-3 font-semibold text-(--color-tinta)"
          >
            Escribir a {CORREO}
          </a>
        </div>
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
