import type { Metadata } from 'next'

import { SelectorPuertaEntrar } from '@/components/selector-puerta-entrar'
import { redirigirSiHaySesion } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entra a Ternio como comprador o como proveedor.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function Entrar() {
  await redirigirSiHaySesion()

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl">Entrar</h1>
      <p className="mt-3 text-(--color-texto-suave)">
        Elige cómo entras. Comprador y proveedor son puertas distintas.
      </p>
      <div className="mt-8">
        <SelectorPuertaEntrar />
      </div>
    </div>
  )
}
