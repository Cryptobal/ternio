'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ChipMiga } from '@/components/chip-miga'
import { SelectorTerritorio } from '@/components/selector-territorio'
import { Aparecer, PasoAnimado } from '@/components/ui/motion'
import {
  claveCombo,
  destinoSelector,
  rubrosEnVenta,
  type RubroSelector,
} from '@/lib/selector-cotizacion'
import type { ComunaTerritorio } from '@/lib/territorio'
import { CLASE_BOTON, CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_SUPERFICIE } from '@/lib/ui'

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

  function elegirServicio(siguiente: string) {
    setSlug(siguiente)
    setComunaSlug('')
    setError(undefined)
  }

  function quitarServicio() {
    setSlug('')
    setComunaSlug('')
    setError(undefined)
  }

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
    <Aparecer>
      <form onSubmit={ir} className={CLASE_SUPERFICIE}>
        {rubro ? (
          <div className="mb-4">
            <ChipMiga
              etiqueta={rubro.nombrePlural ?? rubro.nombre}
              onQuitar={quitarServicio}
              ariaLabel="Cambiar servicio"
            />
          </div>
        ) : null}

        <PasoAnimado id={rubro ? `territorio-${rubro.slug}` : 'servicio'}>
          {!rubro ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">¿Qué servicio?</legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {enVenta.map((item) => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => elegirServicio(item.slug)}
                      className={`${CLASE_CHIP} w-full ${slug === item.slug ? CLASE_CHIP_ACTIVO : ''}`}
                    >
                      {item.nombrePlural ?? item.nombre}
                    </button>
                  </li>
                ))}
                {enCaptura.map((item) => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => elegirServicio(item.slug)}
                      className={`${CLASE_CHIP} w-full ${slug === item.slug ? CLASE_CHIP_ACTIVO : ''}`}
                    >
                      <span className="block">{item.nombrePlural ?? item.nombre}</span>
                      <span className="mt-0.5 block text-xs text-(--color-tinta-suave)">
                        Lista de espera
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : (
            <div className="grid gap-4">
              {comunas.length > 0 ? (
                <SelectorTerritorio
                  key={rubro.slug}
                  comunas={comunas}
                  value={comunaSlug}
                  onChange={(siguiente) => {
                    setComunaSlug(siguiente)
                    setError(undefined)
                  }}
                  idPrefijo="selector-home"
                />
              ) : null}

              {error ? <p className="text-sm text-(--color-rojo)">{error}</p> : null}

              {comunaSlug ? (
                <button type="submit" className={CLASE_BOTON}>
                  Cotizar
                </button>
              ) : null}
            </div>
          )}
        </PasoAnimado>
      </form>
    </Aparecer>
  )
}
