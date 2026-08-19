'use client'

import { useEffect, useState } from 'react'

import {
  CLAVE_TEMA,
  colorTemaMeta,
  esTema,
  resolverTemaInicial,
  type Tema,
} from '@/lib/tema'

function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute('data-tema', tema)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', colorTemaMeta(tema))
}

function leerTemaActual(): Tema {
  const attr = document.documentElement.getAttribute('data-tema')
  if (esTema(attr)) return attr
  const guardado = localStorage.getItem(CLAVE_TEMA)
  return resolverTemaInicial(guardado)
}

export function InterruptorTema({ className = '' }: { className?: string }) {
  const [tema, setTema] = useState<Tema>('dia')
  const [listo, setListo] = useState(false)

  useEffect(() => {
    setTema(leerTemaActual())
    setListo(true)
  }, [])

  function alternar() {
    const actual = leerTemaActual()
    const siguiente: Tema = actual === 'dia' ? 'noche' : 'dia'
    try {
      localStorage.setItem(CLAVE_TEMA, siguiente)
    } catch {
      /* private mode: igual aplicamos el tema en la sesión */
    }
    aplicarTema(siguiente)
    setTema(siguiente)
    setListo(true)
  }

  const esNoche = tema === 'noche'
  const etiqueta = esNoche ? 'Cambiar a modo día' : 'Cambiar a modo noche'

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={etiqueta}
      title={etiqueta}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-white/55 hover:bg-white/10 ${className}`}
      suppressHydrationWarning
    >
      {listo && esNoche ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
