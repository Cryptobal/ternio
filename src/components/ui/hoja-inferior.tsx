'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Hoja inferior móvil: portal a document.body.
 * Sin librerías de drawer; cierra con Escape / velo; bloquea scroll.
 */
export function HojaInferior({
  abierta,
  onCerrar,
  titulo,
  children,
  disparadorRef,
}: {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: React.ReactNode
  /** Elemento al que devolver el foco al cerrar. */
  disparadorRef?: React.RefObject<HTMLElement | null>
}) {
  const [montado, setMontado] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const tituloId = useId()

  useEffect(() => {
    setMontado(true)
  }, [])

  useEffect(() => {
    if (!abierta) return

    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const disparador = disparadorRef?.current ?? null

    function tecla(event: KeyboardEvent) {
      if (event.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', tecla)

    const panel = panelRef.current
    const enfocable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    enfocable?.focus()

    return () => {
      document.body.style.overflow = previo
      document.removeEventListener('keydown', tecla)
      disparador?.focus()
    }
  }, [abierta, onCerrar, disparadorRef])

  if (!montado || !abierta) return null

  return createPortal(
    <div className="fixed inset-0 z-50 sm:hidden" role="presentation">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/55"
        onClick={onCerrar}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border border-white/15 bg-[#0a1522] text-white shadow-[0_-16px_40px_-20px_rgb(0_0_0/0.7)]"
      >
        <div className="flex shrink-0 flex-col items-center gap-3 px-4 pb-2 pt-3">
          <span
            aria-hidden="true"
            className="h-1 w-10 rounded-full bg-white/35"
          />
          <h2 id={tituloId} className="w-full text-base font-medium text-white">
            {titulo}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
