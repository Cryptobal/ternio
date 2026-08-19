import type { Metadata } from 'next'
import Link from 'next/link'

import { FormularioOtpCodigo } from '@/components/formulario-otp'
import { reclamarLeadsAction } from '@/server/leads'
import { solicitarOtpDesdeReclamoAction } from '@/server/otp'
import { sesionActual } from '@/server/sesion'

/** Flujo privado: nunca se indexa. */
export const metadata: Metadata = {
  title: 'Recibimos tu cotización',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ estado?: string }> }

export default async function CotizacionEnviada({ searchParams }: Props) {
  const { estado } = await searchParams
  const sesion = await sesionActual()
  const reclamo = sesion ? await reclamarLeadsAction() : { reclamados: 0 }
  const otp = sesion ? null : await solicitarOtpDesdeReclamoAction()

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl">
        {estado === 'duplicada' ? 'Ya teníamos tu solicitud' : 'Recibimos tu cotización'}
      </h1>

      <p className="mt-3 text-(--color-texto-suave)">
        {estado === 'duplicada'
          ? 'Encontramos una solicitud tuya reciente para este servicio, así que no la duplicamos.'
          : 'Estamos verificando tus datos. Es rápido y lo hacemos para que solo lleguen solicitudes reales a las empresas.'}
      </p>

      {sesion ? (
        <div className="mt-8 rounded-2xl border border-(--color-borde) bg-(--color-superficie) p-5 shadow-sm">
          <p className="font-medium">
            {reclamo.reclamados > 0
              ? 'Listo: tu cotización quedó guardada.'
              : 'Tu sesión ya está lista.'}
          </p>
          <p className="mt-1 text-sm text-(--color-texto-suave)">
            En tus cotizaciones ves qué pediste y cuántas empresas la tomaron.
          </p>
          <Link
            href="/mis-cotizaciones"
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-(--color-marca) px-5 py-3 text-white"
          >
            Ver mis cotizaciones
          </Link>
        </div>
      ) : otp?.telefonoEnmascarado || otp?.ok ? (
        <div className="mt-8">
          <p className="text-(--color-texto-suave)">
            Crea tu acceso o entra con este celular para seguir la solicitud. El código es de un
            solo uso.
          </p>
          <FormularioOtpCodigo
            origen="reclamo"
            telefonoEnmascarado={otp.telefonoEnmascarado}
            avisoInicial={otp.mensaje}
          />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-(--color-ambar-borde) bg-(--color-ambar-suave) p-5 text-sm">
          <p className="font-medium">Tu cotización quedó guardada.</p>
          <p className="mt-1">
            Crea tu acceso o entra con este celular para seguir la solicitud.{' '}
            <Link href="/entrar" className="font-medium underline underline-offset-4">
              Ir a entrar
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
