import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Condiciones de uso de Ternio para compradores y empresas proveedoras.',
  alternates: { canonical: '/terminos' },
}

/**
 * PENDIENTE DE REVISIÓN LEGAL (ver nota en /privacidad).
 */
export default function Terminos() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl">Términos de uso</h1>
      <p className="mt-2 text-sm text-(--color-tinta-suave)">
        Última actualización: agosto de 2026.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Qué es Ternio</h2>
        <p>
          Ternio conecta empresas que necesitan un servicio con empresas que lo prestan. No
          prestamos los servicios cotizados ni participamos en el contrato que acuerdes con la
          empresa que te contacte.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Para quien cotiza</h2>
        <p>
          Cotizar es gratis y no te obliga a contratar. Te pedimos que los datos que entregues
          sean verdaderos: con datos falsos no podemos verificar la solicitud ni ofrecerla a
          nadie.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Para las empresas proveedoras</h2>
        <p>
          Las empresas proveedoras compran el contacto de solicitudes verificadas con créditos
          prepagados. El precio depende del rubro, de si la solicitud es exclusiva o compartida
          y de hace cuánto se creó. Si el contacto resulta inubicable o los datos son falsos,
          la empresa puede reclamar dentro de 48 horas y le devolvemos los créditos.
        </p>
        <p>
          Está prohibido usar los contactos comprados para algo distinto de cotizar el servicio
          solicitado, y prohibido generar solicitudes propias para inflar la demanda.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Responsabilidad</h2>
        <p>
          Verificamos los datos de contacto, no la calidad ni el cumplimiento de las empresas
          proveedoras ni de los compradores. La relación comercial y sus consecuencias son
          entre las partes.
        </p>
      </section>
    </article>
  )
}
