import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TITULO_404 } from '@/lib/copy-flujo'

/**
 * Destino del rewrite que usa el middleware para responder 404 sin revelar
 * nada (ver src/middleware.ts). El title va acá y en not-found.tsx: el
 * rewrite a /admin no puede heredar el title de la home.
 */
export const metadata: Metadata = {
  title: { absolute: TITULO_404 },
  robots: { index: false, follow: false },
}

export default function PaginaNoEncontrada(): never {
  notFound()
}
