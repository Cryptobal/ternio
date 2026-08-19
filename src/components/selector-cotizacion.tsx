'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ChipMiga } from '@/components/chip-miga'
import { ComboServicio } from '@/components/combo-servicio'
import { SelectorTerritorio } from '@/components/selector-territorio'
import { PasoAnimado } from '@/components/ui/motion'
import { RielFases } from '@/components/ui/riel-fases'
import {
  audienciaInicialParaPagina,
  filtrarServiciosPorAudiencia,
  PREGUNTA_AUDIENCIA,
  pasoCotizador,
  type Audiencia,
} from '@/lib/audiencia'
import { progresoSelectorNecesidad } from '@/lib/fases-cotizacion'
import {
  claveCombo,
  destinoSelector,
  type RubroSelector,
} from '@/lib/selector-cotizacion'
import type { ComunaTerritorio } from '@/lib/territorio'
import {
  CLASE_BOTON_AMBAR,
  CLASE_PREGUNTA_NAVY,
  CLASE_TARJETA_AUDIENCIA,
  CLASE_TARJETA_AUDIENCIA_ACTIVA,
} from '@/lib/ui'

const PALABRA: Record<Audiencia, string> = {
  hogar: 'Casa',
  empresa: 'Empresa',
}

const MICRO: Record<Audiencia, string> = {
  hogar: 'hogar',
  empresa: 'negocio',
}

function IconoCasa() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconoEmpresa() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20V7.5L12 3l8 4.5V20H4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function SelectorCotizacion({
  rubros,
  comunas,
  publicados = [],
  rubroInicial,
  audienciaInicial,
  comunaInicial,
  idPrefijo = 'selector-home',
}: {
  rubros: RubroSelector[]
  comunas: ComunaTerritorio[]
  publicados?: string[]
  rubroInicial?: string
  audienciaInicial?: string | null
  /** Comuna ya elegida (p. ej. query string validada). */
  comunaInicial?: string
  idPrefijo?: string
}) {
  const router = useRouter()
  const navegando = useRef(false)
  /** VENTA y CAPTURA: el combo los agrupa; CAPTURA queda en lista de espera. */
  const servicios = rubros
  const partida = servicios.find((item) => item.slug === rubroInicial)

  const [audiencia, setAudiencia] = useState<Audiencia | ''>(() =>
    partida ? audienciaInicialParaPagina(partida.audiencias, audienciaInicial) : '',
  )
  const [slug, setSlug] = useState(partida?.slug ?? '')
  const [comunaSlug, setComunaSlug] = useState(comunaInicial ?? '')
  const [error, setError] = useState<string | undefined>()

  const rubro = useMemo(
    () => servicios.find((item) => item.slug === slug) ?? null,
    [servicios, slug],
  )
  const publicadosSet = useMemo(() => new Set(publicados), [publicados])
  const paso = pasoCotizador(audiencia, slug)
  const delFiltro = audiencia
    ? filtrarServiciosPorAudiencia(servicios, audiencia)
    : servicios

  const tramos = progresoSelectorNecesidad(audiencia, slug, comunaSlug)

  function navegarA(comuna: string) {
    if (!rubro || !comuna || navegando.current) return
    navegando.current = true
    setError(undefined)
    const publicado = publicadosSet.has(claveCombo(rubro.slug, comuna))
    router.push(destinoSelector(rubro, comuna, publicado, audiencia || undefined))
  }

  function ir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rubro) return
    if (!comunaSlug) {
      setError('Elige una comuna.')
      return
    }
    navegarA(comunaSlug)
  }

  if (rubros.length === 0) return null

  return (
    <form onSubmit={ir} className="grid gap-4 text-white">
      <RielFases tramos={tramos} variante="navy" />

      {audiencia || rubro ? (
        <div className="flex flex-wrap gap-2">
          {audiencia ? (
            <ChipMiga
              variante="navy"
              onQuitar={() => {
                setAudiencia('')
                setSlug('')
                setComunaSlug('')
                setError(undefined)
                navegando.current = false
              }}
            >
              {PALABRA[audiencia]}
            </ChipMiga>
          ) : null}
          {rubro ? (
            <ChipMiga
              variante="navy"
              onQuitar={() => {
                setSlug('')
                setComunaSlug('')
                setError(undefined)
                navegando.current = false
              }}
            >
              {rubro.nombrePlural ?? rubro.nombre}
            </ChipMiga>
          ) : null}
        </div>
      ) : null}

      <PasoAnimado id={paso === 'territorio' && rubro ? `territorio-${rubro.slug}` : paso}>
        {paso === 'audiencia' ? (
          <fieldset>
            <legend className={CLASE_PREGUNTA_NAVY}>{PREGUNTA_AUDIENCIA}</legend>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(['hogar', 'empresa'] as const).map((opcion) => {
                const activa = audiencia === opcion
                return (
                  <li key={opcion}>
                    <button
                      type="button"
                      aria-pressed={activa}
                      onClick={() => {
                        setAudiencia(opcion)
                        setSlug('')
                        setComunaSlug('')
                        setError(undefined)
                        navegando.current = false
                      }}
                      className={`${CLASE_TARJETA_AUDIENCIA} ${activa ? CLASE_TARJETA_AUDIENCIA_ACTIVA : ''}`}
                    >
                      {opcion === 'hogar' ? <IconoCasa /> : <IconoEmpresa />}
                      <span className="text-xl font-semibold">{PALABRA[opcion]}</span>
                      <span className="font-mono text-[0.7rem] uppercase tracking-wider text-white/55">
                        {MICRO[opcion]}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        ) : null}

        {paso === 'servicio' ? (
          <ComboServicio
            servicios={delFiltro}
            idPrefijo={idPrefijo}
            abrirAlMontar
            onElegir={(siguiente) => {
              setSlug(siguiente)
              setComunaSlug('')
              setError(undefined)
              navegando.current = false
            }}
          />
        ) : null}

        {paso === 'territorio' && comunas.length > 0 ? (
          <SelectorTerritorio
            comunas={comunas}
            value={comunaSlug}
            variante="navy"
            frecuentes
            onChange={(siguiente) => {
              setComunaSlug(siguiente)
              setError(undefined)
              if (siguiente) navegarA(siguiente)
            }}
            idPrefijo={idPrefijo}
          />
        ) : null}
      </PasoAnimado>

      {error ? <p className="text-sm text-[#ffb4a8]">{error}</p> : null}

      {/* Respaldo si hay comuna y aún no se navegó (p. ej. Enter / comunaInicial). */}
      {rubro && comunaSlug && !navegando.current ? (
        <button type="submit" className={CLASE_BOTON_AMBAR}>
          Cotizar
        </button>
      ) : null}
    </form>
  )
}
