'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ChipMiga } from '@/components/chip-miga'
import { SelectorTerritorio } from '@/components/selector-territorio'
import { PasoAnimado } from '@/components/ui/motion'
import {
  claveCombo,
  destinoSelector,
  rubrosEnVenta,
  type RubroSelector,
} from '@/lib/selector-cotizacion'
import type { ComunaTerritorio } from '@/lib/territorio'
import { CLASE_BOTON, CLASE_CHIP, CLASE_SUPERFICIE } from '@/lib/ui'

export function SelectorCotizacion({
  rubros,
  comunas,
  publicados = [],
}: {
  rubros: RubroSelector[]
  comunas: ComunaTerritorio[]
  publicados?: string[]
}) {
  const router = useRouter()
  const enVenta = rubrosEnVenta(rubros)
  const enCaptura = rubros.filter((rubro) => rubro.modo === 'CAPTURA')
  const [slug, setSlug] = useState('')
  const [comunaSlug, setComunaSlug] = useState('')
  const [error, setError] = useState<string | undefined>()

  const rubro = useMemo(
    () => rubros.find((item) => item.slug === slug) ?? null,
    [rubros, slug],
  )

  const publicadosSet = useMemo(() => new Set(publicados), [publicados])
  const servicios = [...enVenta, ...enCaptura]

  function ir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rubro) return
    if (!comunaSlug) {
      setError('Elige una comuna.')
      return
    }
    setError(undefined)
    const publicado = publicadosSet.has(claveCombo(rubro.slug, comunaSlug))
    router.push(destinoSelector(rubro, comunaSlug, publicado))
  }

  if (rubros.length === 0) return null

  return (
    <form onSubmit={ir} className={CLASE_SUPERFICIE}>
      <div className="grid gap-4">
        {rubro ? (
          <div className="flex flex-wrap gap-2">
            <ChipMiga
              onQuitar={() => {
                setSlug('')
                setComunaSlug('')
                setError(undefined)
              }}
            >
              {rubro.nombrePlural ?? rubro.nombre}
            </ChipMiga>
          </div>
        ) : null}

        <PasoAnimado id={rubro ? `territorio-${rubro.slug}` : 'servicio'}>
          {!rubro ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">¿Qué servicio necesitas?</legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {servicios.map((item) => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(item.slug)
                        setComunaSlug('')
                        setError(undefined)
                      }}
                      className={`${CLASE_CHIP} w-full`}
                    >
                      <span className="font-medium">{item.nombrePlural ?? item.nombre}</span>
                      {item.modo === 'CAPTURA' ? (
                        <span className="mt-0.5 block text-xs text-(--color-tinta-suave)">
                          Lista de espera
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : comunas.length > 0 ? (
            <SelectorTerritorio
              comunas={comunas}
              value={comunaSlug}
              onChange={(siguiente) => {
                setComunaSlug(siguiente)
                setError(undefined)
              }}
              idPrefijo="selector-home"
            />
          ) : null}
        </PasoAnimado>

        {error ? <p className="text-sm text-(--color-rojo)">{error}</p> : null}

        {rubro && comunaSlug ? (
          <button type="submit" className={CLASE_BOTON}>
            Cotizar
          </button>
        ) : null}
      </div>
    </form>
  )
}
