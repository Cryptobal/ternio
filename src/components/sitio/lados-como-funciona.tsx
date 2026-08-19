'use client'

import { useState } from 'react'

import {
  LADO_COMPRADOR,
  LADO_PROVEEDOR,
  type LadoFlujo,
} from '@/lib/contenido-como-funciona'
import { CLASE_BOTON, CLASE_BOTON_SUAVE } from '@/lib/ui'
import Link from 'next/link'

const LADOS = [LADO_COMPRADOR, LADO_PROVEEDOR] as const

export function LadosComoFunciona() {
  const [activo, setActivo] = useState<LadoFlujo['id']>('comprador')
  const lado = LADOS.find((l) => l.id === activo) ?? LADO_COMPRADOR

  return (
    <div>
      <div
        role="tablist"
        aria-label="Elige tu lado"
        className="flex flex-wrap gap-2 rounded-2xl border border-(--color-borde) bg-(--color-superficie-2) p-1.5"
      >
        {LADOS.map((item) => {
          const seleccionado = item.id === activo
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={seleccionado}
              onClick={() => setActivo(item.id)}
              className={`min-h-12 flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                seleccionado
                  ? 'bg-(--color-superficie) text-(--color-texto) shadow-sm'
                  : 'text-(--color-texto-suave) hover:text-(--color-texto)'
              }`}
            >
              {item.etiqueta}
            </button>
          )
        })}
      </div>

      <ol className="mt-8 grid gap-5">
        {lado.pasos.map((paso, i) => (
          <li key={paso.titulo} className="flex gap-4">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--color-hero) font-mono text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <h3 className="font-display text-lg">{paso.titulo}</h3>
              <p className="mt-1 text-(--color-texto-suave)">{paso.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl bg-(--color-ambar) px-5 py-4 text-(--color-tinta)">
        <p className="text-base font-medium leading-snug">{lado.cierre}</p>
      </div>

      <div className="mt-6">
        <Link href={lado.cta.href} className={CLASE_BOTON}>
          {lado.cta.etiqueta}
        </Link>
        {lado.id === 'comprador' ? (
          <Link href="/precios" className={`${CLASE_BOTON_SUAVE} mt-3`}>
            Ver precios
          </Link>
        ) : (
          <Link href="/precios" className={`${CLASE_BOTON_SUAVE} mt-3`}>
            Ver precios de contactos
          </Link>
        )}
      </div>
    </div>
  )
}
