'use client'

import { useActionState, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { HojaInferior } from '@/components/ui/hoja-inferior'
import { filtrarServiciosPorTexto, ordenarServiciosPorNombre } from '@/lib/audiencia'
import { agruparPorGrupo, grupoRubro, type GrupoRubro } from '@/lib/grupos-rubro'
import { CLASE_CAMPO_NAVY, CLASE_LEYENDA_NAVY } from '@/lib/ui'
import { solicitarOtroServicioAction, type EstadoFormulario } from '@/server/leads'

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
  'mt-2 max-h-72 w-full overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-[#0a1522] py-1'

const PLACEHOLDER_SERVICIO = 'Escribe el servicio'

const CLASE_OPCION =
  'flex min-h-11 w-full px-3.5 py-2.5 text-left text-sm'

const ESTADO_DEMANDA: EstadoFormulario = { ok: false }

function BotonDemanda() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 min-h-11 w-full rounded-2xl border border-white/25 px-3.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
    >
      {pending ? 'Anotando…' : 'Anotar y avisarme'}
    </button>
  )
}

/** Salida real del estado vacío: registra demanda sin prometer proveedores. */
function DemandaServicioInexistente({ texto }: { texto: string }) {
  const [estado, accion] = useActionState(solicitarOtroServicioAction, ESTADO_DEMANDA)

  if (estado.ok) {
    return (
      <p role="status" className="text-sm text-white/70">
        {estado.mensaje}
      </p>
    )
  }

  return (
    <form action={accion} className="space-y-1">
      <p className="text-sm text-white/55">
        No tenemos ese servicio todavía. Déjanos el nombre y te avisamos.
      </p>
      <input type="hidden" name="textoRubro" value={texto} />
      <BotonDemanda />
      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="text-sm text-(--color-rojo)">
          {estado.mensaje}
        </p>
      ) : null}
    </form>
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
  const disparadorRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [grupo, setGrupo] = useState<GrupoRubro | ''>('')
  const [abierto, setAbierto] = useState(abrirAlMontar)
  const [activo, setActivo] = useState(0)
  const [escritorio, setEscritorio] = useState<boolean | null>(null)

  const grupos = useMemo(() => agruparPorGrupo(servicios), [servicios])
  const delGrupo = useMemo(
    () => (grupo ? servicios.filter((item) => grupoRubro(item.slug) === grupo) : servicios),
    [servicios, grupo],
  )
  const filtrados = useMemo(
    () => ordenarServiciosPorNombre(filtrarServiciosPorTexto(delGrupo, query)),
    [delGrupo, query],
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

  function chipsGrupo() {
    if (grupos.length < 2) return null
    return (
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={!grupo}
          onClick={() => setGrupo('')}
          className={`rounded-full border px-2.5 py-1 text-xs ${
            !grupo ? 'border-white/70 bg-white/10 text-white' : 'border-white/25 text-white/70'
          }`}
        >
          Todos
        </button>
        {grupos.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={grupo === item.id}
            onClick={() => setGrupo(item.id)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              grupo === item.id ? 'border-white/70 bg-white/10 text-white' : 'border-white/25 text-white/70'
            }`}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>
    )
  }

  function estadoVacio() {
    const texto = query.trim()
    if (texto.length >= 3) {
      return (
        <li className="px-3.5 py-3" role="presentation">
          <DemandaServicioInexistente texto={texto} />
        </li>
      )
    }
    return (
      <li className="px-3.5 py-3 text-sm text-white/55">
        {texto
          ? 'Sigue escribiendo el nombre del servicio…'
          : 'Escribe el servicio o elige de la lista.'}
      </li>
    )
  }

  function lista() {
    return (
      <ul id={listboxId} role="listbox" className={CLASE_LISTA_FLUJO}>
        {planos.length === 0 ? (
          estadoVacio()
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
    const etiquetaBoton = query.trim() || PLACEHOLDER_SERVICIO
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
            placeholder={PLACEHOLDER_SERVICIO}
            onChange={(event) => setQuery(event.target.value)}
            className={`${CLASE_CAMPO_NAVY} mb-3`}
          />
          {chipsGrupo()}
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
        placeholder={PLACEHOLDER_SERVICIO}
        onChange={(event) => {
          setQuery(event.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={tecla}
        className={CLASE_CAMPO_NAVY}
      />
      {abierto ? (
        <div className="mt-2">
          {chipsGrupo()}
          {lista()}
        </div>
      ) : null}
    </div>
  )
}
