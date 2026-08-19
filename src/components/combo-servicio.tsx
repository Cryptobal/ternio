'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { filtrarServiciosPorTexto } from '@/lib/audiencia'
import { CLASE_CAMPO_NAVY, CLASE_LEYENDA_NAVY } from '@/lib/ui'

export type ServicioCombo = {
  slug: string
  nombre: string
  nombrePlural?: string | null
  modo?: string
}

function resaltar(texto: string, query: string): React.ReactNode {
  const q = query.trim()
  if (!q) return texto
  const i = texto.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return texto
  return (
    <>
      {texto.slice(0, i)}
      <mark className="rounded bg-(--color-ambar)/35 text-inherit">{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length)}
    </>
  )
}

export function ComboServicio({
  servicios,
  onElegir,
  idPrefijo = 'combo-servicio',
  abrirAlMontar = false,
}: {
  servicios: ServicioCombo[]
  onElegir: (slug: string) => void
  idPrefijo?: string
  /** Abre la lista poblada al montar el paso. */
  abrirAlMontar?: boolean
}) {
  const listboxId = useId()
  const inputId = `${idPrefijo}-input`
  const caja = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(abrirAlMontar)
  const [activo, setActivo] = useState(0)

  const filtrados = useMemo(
    () => filtrarServiciosPorTexto(servicios, query),
    [servicios, query],
  )

  const disponibles = useMemo(
    () => filtrados.filter((s) => (s.modo ?? 'VENTA') === 'VENTA'),
    [filtrados],
  )
  const espera = useMemo(
    () => filtrados.filter((s) => s.modo === 'CAPTURA'),
    [filtrados],
  )

  const planos = useMemo(() => [...disponibles, ...espera], [disponibles, espera])

  useEffect(() => {
    setActivo(0)
  }, [query])

  useEffect(() => {
    if (abrirAlMontar) setAbierto(true)
  }, [abrirAlMontar])

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

  function fila(item: ServicioCombo, indiceGlobal: number) {
    const etiqueta = item.nombrePlural ?? item.nombre
    return (
      <li key={item.slug} role="option" aria-selected={indiceGlobal === activo}>
        <button
          type="button"
          onMouseEnter={() => setActivo(indiceGlobal)}
          onClick={() => elegir(item.slug)}
          className={`flex w-full px-3.5 py-2.5 text-left text-sm ${
            indiceGlobal === activo ? 'bg-white/10 text-white' : 'text-white/90'
          }`}
        >
          {resaltar(etiqueta, query)}
        </button>
      </li>
    )
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
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/20 bg-[#0a1522] py-1 shadow-[0_16px_40px_-20px_rgb(0_0_0/0.7)]"
        >
          {planos.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-white/55">
              No hay un servicio con ese nombre. Escríbelo igual: queda en lista de espera.
            </li>
          ) : (
            <>
              {disponibles.length > 0 ? (
                <>
                  <li className="px-3.5 pb-1 pt-2 font-eyebrow text-[0.65rem] text-white/45">
                    Disponibles ahora
                  </li>
                  {disponibles.map((item, i) => fila(item, i))}
                </>
              ) : null}
              {espera.length > 0 ? (
                <>
                  <li className="px-3.5 pb-1 pt-2 font-eyebrow text-[0.65rem] text-white/45">
                    Lista de espera
                  </li>
                  {espera.map((item, i) => fila(item, disponibles.length + i))}
                </>
              ) : null}
            </>
          )}
        </ul>
      ) : null}
    </div>
  )
}
