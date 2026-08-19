'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { HojaInferior } from '@/components/ui/hoja-inferior'
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

const CLASE_LISTA_FLUJO =
  'mt-2 w-full rounded-2xl border border-white/20 bg-[#0a1522] py-1'

const CLASE_OPCION =
  'flex min-h-11 w-full px-3.5 py-2.5 text-left text-sm'

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
  const disparadorRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(abrirAlMontar)
  const [activo, setActivo] = useState(0)
  const [escritorio, setEscritorio] = useState<boolean | null>(null)

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
    const mql = window.matchMedia('(min-width: 640px)')
    function sync() {
      setEscritorio(mql.matches)
    }
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (abrirAlMontar) setAbierto(true)
  }, [abrirAlMontar])

  useEffect(() => {
    if (!escritorio) return
    function fuera(event: MouseEvent) {
      if (!caja.current?.contains(event.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [escritorio])

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
          className={`${CLASE_OPCION} ${
            indiceGlobal === activo ? 'bg-white/10 text-white' : 'text-white/90'
          }`}
        >
          {resaltar(etiqueta, query)}
        </button>
      </li>
    )
  }

  function lista() {
    return (
      <ul id={listboxId} role="listbox" className={CLASE_LISTA_FLUJO}>
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
    )
  }

  // Hasta conocer el breakpoint no montamos input e ids duplicados.
  if (escritorio === null) {
    return (
      <div>
        <p className={CLASE_LEYENDA_NAVY}>¿Qué servicio necesitas?</p>
        <div className={`${CLASE_CAMPO_NAVY} animate-pulse`} aria-hidden="true">
          &nbsp;
        </div>
      </div>
    )
  }

  if (!escritorio) {
    const etiquetaBoton = query.trim() || 'Escribe o elige un servicio'
    return (
      <div>
        <p className={CLASE_LEYENDA_NAVY}>¿Qué servicio necesitas?</p>
        <button
          ref={disparadorRef}
          type="button"
          aria-expanded={abierto}
          aria-haspopup="dialog"
          onClick={() => setAbierto(true)}
          className={`${CLASE_CAMPO_NAVY} text-left ${query.trim() ? 'text-white' : 'text-white/45'}`}
        >
          {etiquetaBoton}
        </button>
        <HojaInferior
          abierta={abierto}
          onCerrar={() => setAbierto(false)}
          titulo="¿Qué servicio necesitas?"
          disparadorRef={disparadorRef}
        >
          <label htmlFor={inputId} className="sr-only">
            Buscar servicio
          </label>
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            value={query}
            placeholder="Escribe o elige un servicio"
            onChange={(event) => setQuery(event.target.value)}
            className={`${CLASE_CAMPO_NAVY} mb-3`}
          />
          {lista()}
        </HojaInferior>
      </div>
    )
  }

  return (
    <div ref={caja}>
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
      {abierto ? lista() : null}
    </div>
  )
}
