import type { Metadata } from 'next'
import Link from 'next/link'

import { MarcoPublico } from '@/components/sitio/marco-publico'
import { TITULO_404 } from '@/lib/copy-flujo'

export const metadata: Metadata = {
  title: { absolute: TITULO_404 },
  robots: { index: false, follow: false },
}

export default function NoEncontrado() {
  return (
    <MarcoPublico>
      <title>{TITULO_404}</title>
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl">No encontramos esta página</h1>
        <p className="mt-3 text-(--color-texto-suave)">
          Puede que el enlace esté malo o que la página ya no exista.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-(--color-marca) px-5 py-3 font-medium text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </MarcoPublico>
  )
}
