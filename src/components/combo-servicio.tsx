'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { filtrarServiciosPorTexto } from '@/lib/audiencia'
import { agruparPorGrupo } from '@/lib/grupos-rubro'
import { CLASE_CAMPO_NAVY, CLASE_LEYENDA_NAVY } from '@/lib/ui'

export type ServicioCombo = {
  slug: string
  nombre: string
  nombrePlural?: string | null
  modo?: string
}

export function ComboServicio({
  servicios,
  onElegir,
  idPrefijo = 'combo-servicio',
}: {
  servicios: ServicioCombo[]
  onElegir: (slug: string) => void
  idPrefijo?: string
}) {
  const listboxId = useId()
  const inputId = `${idPrefijo}-input`
  const caja = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)

  const filtrados = useMemo(
    () => filtrarServiciosPorTexto(servicios, query),
    [servicios, query],
  )
  const grupos = useMemo(() => agruparPorGrupo(filtrados), [filtrados])
  const planos = useMemo(() => grupos.flatMap((grupo) => grupo.rubros), [grupos])

  useEffect(() => {
    setActivo(0)
  }, [query])

  useEffect(() => {
    function fuera(event: MouseEvent) {
      if (!caja.current?.contains(event.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  function elegir(slug: string) {
    onElegir(slug)
    setQuery('')
    setAbierto(false)
  }

  function tecla(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setAbierto(true)
      setActivo((i) => (planos.length === 0 ? 0 : (i + 1) % planos.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setAbierto(true)
      setActivo((i) => (planos.length === 0 ? 0 : (i - 1 + planos.length) % planos.length))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const elegido = planos[activo]
      if (elegido) elegir(elegido.slug)
      return
    }
    if (event.key === 'Escape') {
      setAbierto(false)
    }
  }

  return (
    <div ref={caja} className="relative">
      <label htmlFor={inputId} className={`block ${CLASE_LEYENDA_NAVY}`}>
        ¿Qué servicio necesitas?
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder="Escribe o elige un servicio"
        onChange={(event) => {
          setQuery(event.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={tecla}
        className={CLASE_CAMPO_NAVY}
      />
      {abierto ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/20 bg-[#0a1522] py-1 shadow-[0_16px_40px_-20px_rgb(0_0_0/0.7)]"
        >
          {planos.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-white/55">No hay un servicio con ese nombre.</li>
          ) : (
            grupos.map((grupo) => (
              <li key={grupo.id} role="presentation">
                {grupos.length > 1 ? (
                  <p className="px-3.5 pt-2 pb-1 text-xs font-medium tracking-wide text-white/45">
                    {grupo.etiqueta}
                  </p>
                ) : null}
                <ul role="group" aria-label={grupo.etiqueta}>
                  {grupo.rubros.map((item) => {
                    const indice = planos.findIndex((fila) => fila.slug === item.slug)
                    const etiqueta = item.nombrePlural ?? item.nombre
                    return (
                      <li key={item.slug} role="option" aria-selected={indice === activo}>
                        <button
                          type="button"
                          onMouseEnter={() => setActivo(indice)}
                          onClick={() => elegir(item.slug)}
                          className={`flex w-full flex-col px-3.5 py-2.5 text-left text-sm ${
                            indice === activo ? 'bg-white/10 text-white' : 'text-white/90'
                          }`}
                        >
                          <span>{etiqueta}</span>
                          {item.modo === 'CAPTURA' ? (
                            <span className="text-xs text-white/50">Lista de espera</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
