import type { Metadata } from 'next'

import { LadosComoFunciona } from '@/components/sitio/lados-como-funciona'
import { HERO_COMO_FUNCIONA } from '@/lib/contenido-como-funciona'

export const metadata: Metadata = {
  title: 'Cómo funciona',
  description:
    'Cotiza gratis. Las empresas ven una ficha anónima y pagan solo el contacto. Sin mensualidad.',
  alternates: { canonical: '/como-funciona' },
}

export default function ComoFuncionaPage() {
  return (
    <article>
      <section className="bg-(--color-hero) text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            {HERO_COMO_FUNCIONA.titulo}
          </h1>
          <p className="mt-4 text-lg text-white/80">{HERO_COMO_FUNCIONA.bajada}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <LadosComoFunciona />
      </section>
    </article>
  )
}
