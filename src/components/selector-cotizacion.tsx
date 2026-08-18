'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ChipMiga } from '@/components/chip-miga'
import { ComboServicio } from '@/components/combo-servicio'
import { SelectorTerritorio } from '@/components/selector-territorio'
import { PasoAnimado } from '@/components/ui/motion'
import {
  audienciaInicialParaPagina,
  ETIQUETA_AUDIENCIA,
  filtrarServiciosPorAudiencia,
  PREGUNTA_AUDIENCIA,
  pasoCotizador,
  type Audiencia,
} from '@/lib/audiencia'
import {
  claveCombo,
  destinoSelector,
  rubrosEnVenta,
  type RubroSelector,
} from '@/lib/selector-cotizacion'
import type { ComunaTerritorio } from '@/lib/territorio'
import { CLASE_BOTON_AMBAR, CLASE_CHIP_NAVY, CLASE_LEYENDA_NAVY } from '@/lib/ui'

export function SelectorCotizacion({
  rubros,
  comunas,
  publicados = [],
  rubroInicial,
  audienciaInicial,
  idPrefijo = 'selector-home',
}: {
  rubros: RubroSelector[]
  comunas: ComunaTerritorio[]
  publicados?: string[]
  rubroInicial?: string
  audienciaInicial?: string | null
  idPrefijo?: string
}) {
  const router = useRouter()
  const servicios = useMemo(() => rubrosEnVenta(rubros), [rubros])
  const partida = servicios.find((item) => item.slug === rubroInicial)

  const [audiencia, setAudiencia] = useState<Audiencia | ''>(() =>
    partida ? audienciaInicialParaPagina(partida.slug, audienciaInicial) : '',
  )
  const [slug, setSlug] = useState(partida?.slug ?? '')
  const [comunaSlug, setComunaSlug] = useState('')
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

  function ir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rubro) return
    if (!comunaSlug) {
      setError('Elige una comuna.')
      return
    }
    setError(undefined)
    const publicado = publicadosSet.has(claveCombo(rubro.slug, comunaSlug))
    router.push(destinoSelector(rubro, comunaSlug, publicado, audiencia || undefined))
  }

  if (rubros.length === 0) return null

  return (
    <form onSubmit={ir} className="grid gap-4 text-white">
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
              }}
            >
              {ETIQUETA_AUDIENCIA[audiencia]}
            </ChipMiga>
          ) : null}
          {rubro ? (
            <ChipMiga
              variante="navy"
              onQuitar={() => {
                setSlug('')
                setComunaSlug('')
                setError(undefined)
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
            <legend className={CLASE_LEYENDA_NAVY}>{PREGUNTA_AUDIENCIA}</legend>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(['hogar', 'empresa'] as const).map((opcion) => (
                <li key={opcion}>
                  <button
                    type="button"
                    onClick={() => {
                      setAudiencia(opcion)
                      setSlug('')
                      setComunaSlug('')
                      setError(undefined)
                    }}
                    className={`${CLASE_CHIP_NAVY} w-full`}
                  >
                    {ETIQUETA_AUDIENCIA[opcion]}
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}

        {paso === 'servicio' ? (
          <ComboServicio
            servicios={delFiltro}
            idPrefijo={idPrefijo}
            onElegir={(siguiente) => {
              setSlug(siguiente)
              setComunaSlug('')
              setError(undefined)
            }}
          />
        ) : null}

        {paso === 'territorio' && comunas.length > 0 ? (
          <SelectorTerritorio
            comunas={comunas}
            value={comunaSlug}
            variante="navy"
            onChange={(siguiente) => {
              setComunaSlug(siguiente)
              setError(undefined)
            }}
            idPrefijo={idPrefijo}
          />
        ) : null}
      </PasoAnimado>

      {error ? <p className="text-sm text-[#ffb4a8]">{error}</p> : null}

      {rubro && comunaSlug ? (
        <button type="submit" className={CLASE_BOTON_AMBAR}>
          Cotizar
        </button>
      ) : null}
    </form>
  )
}
