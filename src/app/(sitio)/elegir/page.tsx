import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CLASE_SUPERFICIE } from '@/lib/ui'
import { capacidadesDe } from '@/server/capacidades'
import { destinoPorCapacidades } from '@/lib/capacidades'
import { sesionActual } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Elegir cuenta',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function Elegir() {
  const sesion = await sesionActual()
  if (!sesion?.user?.id) redirect('/entrar')

  const caps = await capacidadesDe(sesion.user.id)
  const destino = destinoPorCapacidades(caps)
  if (destino !== '/elegir') redirect(destino)

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl">¿A dónde entras?</h1>
      <p className="mt-3 text-(--color-tinta-suave)">
        Este celular tiene cotizaciones y una cuenta de proveedor. Elige una.
      </p>
      <div className="mt-8 grid gap-4">
        <Link
          href="/mis-cotizaciones"
          className={`${CLASE_SUPERFICIE} block min-h-11 transition hover:border-(--color-marca) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ambar)`}
        >
          <p className="font-display text-xl">Mis cotizaciones</p>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Ver el estado de lo que pedí
          </p>
        </Link>
        <Link
          href="/panel"
          className={`${CLASE_SUPERFICIE} block min-h-11 transition hover:border-(--color-marca) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ambar)`}
        >
          <p className="font-display text-xl">Mi panel de proveedor</p>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">Contactos y saldo</p>
        </Link>
      </div>
    </div>
  )
}
