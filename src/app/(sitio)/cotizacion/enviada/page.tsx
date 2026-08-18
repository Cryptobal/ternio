import type { Metadata } from 'next'
import Link from 'next/link'

import { googleConfigurado } from '@/auth.config'
import { entrarConGoogle } from '@/server/auth-acciones'
import { reclamarLeadsAction } from '@/server/leads'
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

  // Si volvió del login de Google, sus cotizaciones quedan asignadas acá.
  // Es idempotente: entrar de nuevo a esta página no cambia nada.
  const reclamo = sesion ? await reclamarLeadsAction() : { reclamados: 0 }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl">
        {estado === 'duplicada' ? 'Ya teníamos tu solicitud' : 'Recibimos tu cotización'}
      </h1>

      <p className="mt-3 text-(--color-tinta-suave)">
        {estado === 'duplicada'
          ? 'Encontramos una solicitud tuya reciente para este servicio, así que no la duplicamos.'
          : 'Estamos verificando tus datos. Es rápido y lo hacemos para que solo lleguen solicitudes reales a las empresas.'}
      </p>

      {sesion ? (
        <div className="mt-8 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <p className="font-medium">
            {reclamo.reclamados > 0
              ? 'Listo: tu cotización quedó guardada en tu cuenta.'
              : 'Tu cuenta ya está lista.'}
          </p>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Desde tu panel puedes seguir el estado y ver qué empresa la tomó.
          </p>
          <Link
            href="/mis-cotizaciones"
            className="mt-4 inline-block rounded-lg bg-(--color-marca) px-5 py-3 text-white"
          >
            Ver mis cotizaciones
          </Link>
        </div>
      ) : googleConfigurado() ? (
        <div className="mt-8 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
          <h2 className="font-medium">Crea tu cuenta para seguir tu cotización</h2>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Con tu cuenta ves en qué va, verificas tu teléfono una sola vez y sabes qué empresa
            tomó tu solicitud.
          </p>

          <form action={entrarConGoogle} className="mt-4">
            <input type="hidden" name="destino" value="/cotizacion/enviada" />
            <button
              type="submit"
              className="w-full rounded-lg border border-(--color-borde) bg-white px-5 py-3 font-medium transition hover:border-(--color-marca)"
            >
              Continuar con Google
            </button>
          </form>

          <p className="mt-3 text-sm text-(--color-tinta-suave)">
            Tu cotización ya quedó guardada. Crear la cuenta es para que puedas seguirla.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-(--color-ambar-borde) bg-(--color-ambar-suave) p-5 text-sm text-(--color-tinta)">
          <p className="font-medium">Por ahora no podemos crear tu cuenta.</p>
          <p className="mt-1">
            Tu cotización quedó guardada igual y nuestro equipo la va a revisar. Si necesitas
            algo antes, respóndenos el correo de confirmación.
          </p>
        </div>
      )}
    </div>
  )
}
