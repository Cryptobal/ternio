'use client'

import { useReducedMotion } from 'motion/react'

import {
  faseActivaDe,
  type FaseCotizacion,
  type TramoFase,
} from '@/lib/fases-cotizacion'
import { CLASE_RIEL_PROGRESO } from '@/lib/ui'

export function RielFases({
  tramos,
  variante = 'claro',
}: {
  tramos: TramoFase[]
  /** navy = sobre hero; claro = sobre superficie del formulario */
  variante?: 'navy' | 'claro'
}) {
  const reducir = useReducedMotion()
  const activa = faseActivaDe(tramos)
  const tramoActivo = tramos.find((t) => t.fase === activa)
  const etiquetaActiva = tramoActivo?.etiqueta ?? ''
  const indiceActivo = tramos.findIndex((t) => t.fase === activa) + 1

  const pista = variante === 'navy' ? 'bg-white/20' : 'bg-(--color-linea)'
  const relleno = 'bg-(--color-ambar)'
  const etiquetaOn =
    variante === 'navy' ? 'text-white' : 'text-(--color-texto)'
  const etiquetaOff =
    variante === 'navy' ? 'text-white/45' : 'text-(--color-tinta-suave)'

  return (
    <div className="grid gap-2">
      <p className="sr-only">
        Fase {indiceActivo} de 3: {etiquetaActiva}
      </p>
      <div className={CLASE_RIEL_PROGRESO} aria-hidden="true">
        {tramos.map((tramo) => (
          <span
            key={tramo.fase}
            className={`relative h-1 overflow-hidden rounded-full ${pista}`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-full origin-left rounded-full ${relleno} ${
                reducir ? '' : 'transition-transform duration-200'
              }`}
              style={{ transform: `scaleX(${Math.min(1, Math.max(0, tramo.completo))})` }}
            />
          </span>
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        {tramos.map((tramo) => (
          <li
            key={tramo.fase}
            className={`text-center font-eyebrow text-[0.65rem] ${
              tramo.fase === activa ? etiquetaOn : etiquetaOff
            }`}
          >
            {tramo.etiqueta}
          </li>
        ))}
      </ul>
    </div>
  )
}

export type { FaseCotizacion, TramoFase }
