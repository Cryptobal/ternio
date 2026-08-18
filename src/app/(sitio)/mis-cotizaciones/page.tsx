import type { Metadata } from 'next'
import Link from 'next/link'

import { googleConfigurado } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { textoEstadoComprador } from '@/lib/rubros'
import { entrarConGoogle, salir } from '@/server/auth-acciones'
import { reclamarLeadsAction } from '@/server/leads'
import { sesionActual } from '@/server/sesion'

/** Panel privado del comprador: fuera del índice y fuera del sitemap. */
export const metadata: Metadata = {
  title: 'Mis cotizaciones',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const formatoFecha = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default async function MisCotizaciones() {
  const sesion = await sesionActual()

  if (!sesion?.user?.id) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
        <h1 className="font-display text-2xl">Mis cotizaciones</h1>
        <p className="mt-3 text-(--color-tinta-suave)">
          Entra con tu cuenta para ver el estado de las cotizaciones que enviaste.
        </p>

        {googleConfigurado() ? (
          <form action={entrarConGoogle} className="mt-6">
            <input type="hidden" name="destino" value="/mis-cotizaciones" />
            <button
              type="submit"
              className="w-full rounded-lg border border-(--color-borde) bg-white px-5 py-3 font-medium transition hover:border-(--color-marca) sm:w-auto"
            >
              Continuar con Google
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-2xl border border-(--color-ambar-borde) bg-(--color-ambar-suave) p-4 text-sm text-(--color-tinta)">
            Por ahora no podemos abrir cuentas. Tus cotizaciones están guardadas y nuestro
            equipo las está revisando.
          </p>
        )}
      </div>
    )
  }

  // Por si llegó directo acá después de crear la cuenta.
  await reclamarLeadsAction()

  // SIEMPRE filtrado por el comprador de la sesión.
  const cotizaciones = await prisma.lead.findMany({
    where: { compradorUsuarioId: sesion.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      estado: true,
      createdAt: true,
      rubro: { select: { nombre: true, slug: true } },
      comuna: { select: { nombre: true, slug: true } },
    },
  })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">Mis cotizaciones</h1>
        <form action={salir}>
          <button
            type="submit"
            className="text-sm text-(--color-tinta-suave) underline underline-offset-4"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      {cotizaciones.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-(--color-borde) bg-white p-6 shadow-sm">
          <p className="font-medium">Todavía no tienes cotizaciones acá.</p>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Si enviaste una desde otro navegador o hace más de un día, escríbenos y la
            asociamos a tu cuenta.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-(--color-marca) px-5 py-3 text-white"
          >
            Pedir una cotización
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {cotizaciones.map((cotizacion) => (
            <li
              key={cotizacion.id}
              className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">
                  {cotizacion.rubro.nombre} en {cotizacion.comuna.nombre}
                </h2>
                <span className="text-sm text-(--color-tinta-suave)">
                  {formatoFecha.format(cotizacion.createdAt)}
                </span>
              </div>
              <p className="mt-2 inline-block rounded-full bg-(--color-arena) px-3 py-1 text-sm">
                {textoEstadoComprador(cotizacion.estado)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-(--color-tinta-suave)">
        Pronto vas a poder verificar tu teléfono desde acá, una sola vez, para que tu solicitud
        llegue a las empresas.
      </p>
    </div>
  )
}
