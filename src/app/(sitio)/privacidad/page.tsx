import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Cómo Ternio trata los datos personales de quienes cotizan, conforme a la Ley 21.719.',
  alternates: { canonical: '/privacidad' },
}

/**
 * PENDIENTE DE REVISIÓN LEGAL.
 *
 * Este texto describe con fidelidad lo que el sistema hace hoy (Fase 0) y usa
 * el marco de la Ley 21.719, pero no fue redactado ni revisado por un abogado.
 * Antes de correr campañas pagadas hay que hacerlo revisar y completar la
 * identificación del responsable (razón social, RUT y domicilio).
 */
export default function Privacidad() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl">Política de privacidad</h1>
      <p className="mt-2 text-sm text-(--color-tinta-suave)">
        Última actualización: agosto de 2026.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Quién trata tus datos</h2>
        <p>
          Ternio (ternio.cl) es el responsable del tratamiento de los datos personales que
          entregas en este sitio. Puedes escribirnos a{' '}
          <a href="mailto:contacto@ternio.cl" className="underline underline-offset-4">
            contacto@ternio.cl
          </a>{' '}
          por cualquier consulta sobre tus datos.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Qué datos pedimos y para qué</h2>
        <p>
          Cuando pides una cotización te pedimos tu nombre, correo, teléfono y el RUT de la
          empresa, además de los detalles del servicio que necesitas. Los usamos para tres
          cosas: verificar que la solicitud es real, ofrecerla a empresas proveedoras del rubro
          y la comuna que indicaste, y avisarte del estado de tu cotización.
        </p>
        <p>
          También guardamos datos técnicos mínimos de uso del sitio (páginas visitadas y un
          identificador anónimo de navegador) para saber cuánta gente llega y cuánta llega a
          cotizar. Ese identificador no permite reconocerte.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Base legal del tratamiento</h2>
        <p>
          Tratamos tus datos porque tú nos los entregas para pedir una cotización: la base
          legal es la ejecución de las gestiones previas a un contrato que tú solicitas, según
          la Ley 21.719 sobre protección de datos personales. Para el envío de mensajes por
          WhatsApp pedimos tu consentimiento aparte, con una casilla que puedes dejar sin
          marcar, y puedes retirarlo cuando quieras.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Con quién los compartimos</h2>
        <p>
          Tus datos de contacto quedan ocultos mientras nadie tome tu solicitud. Las empresas
          proveedoras solo ven una ficha sin identificarte: el servicio que pediste, la comuna,
          el tamaño del negocio, el plazo y si verificamos tus datos.
        </p>
        <p>
          Cuando una empresa toma tu solicitud, recién ahí recibe tu nombre, teléfono, correo y
          RUT, para poder contactarte y cotizarte. Una solicitud compartida la pueden tomar
          hasta tres empresas; una exclusiva, solo una.
        </p>
        <p>
          Usamos proveedores tecnológicos que procesan datos por encargo nuestro: alojamiento
          del sitio y de la base de datos, correo transaccional, verificación antifraude y
          envío de mensajes de verificación.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Cuánto tiempo los guardamos</h2>
        <p>
          Guardamos tu cotización mientras siga siendo útil para el servicio y por el plazo que
          nos exige la ley para respaldar las operaciones realizadas. Las cotizaciones que
          nadie toma se archivan a los siete días.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Tus derechos</h2>
        <p>
          Puedes pedirnos acceder a tus datos, corregirlos, eliminarlos, oponerte a que los
          tratemos o pedir que te los entreguemos en un formato portable. Escríbenos a{' '}
          <a href="mailto:contacto@ternio.cl" className="underline underline-offset-4">
            contacto@ternio.cl
          </a>{' '}
          y te respondemos dentro de los plazos que fija la ley. Si no quedas conforme, puedes
          reclamar ante la autoridad de protección de datos.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl">Cookies</h2>
        <p>
          Usamos las cookies necesarias para que el sitio funcione: mantener tu sesión y
          recordar la cotización que enviaste para poder asociarla a tu cuenta. No usamos
          cookies de publicidad sin tu consentimiento.
        </p>
      </section>
    </article>
  )
}
