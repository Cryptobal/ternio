'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Aparecer } from '@/components/ui/motion'
import { SelectorTerritorio } from '@/components/selector-territorio'
import {
  claveCombo,
  destinoSelector,
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
  const enVenta = rubros.filter((rubro) => rubro.modo === 'VENTA')
  const enCaptura = rubros.filter((rubro) => rubro.modo === 'CAPTURA')
  const [slug, setSlug] = useState(enVenta[0]?.slug ?? enCaptura[0]?.slug ?? '')
  const [comunaSlug, setComunaSlug] = useState('')
  const [error, setError] = useState<string | undefined>()

  const rubro = useMemo(
    () => rubros.find((item) => item.slug === slug) ?? null,
    [rubros, slug],
  )

  const publicadosSet = useMemo(() => new Set(publicados), [publicados])

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
        <div className="grid gap-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Servicio</legend>
            <ul className="grid gap-2">
              {enVenta.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSlug(item.slug)
                      setError(undefined)
                    }}
                    className={`${CLASE_CHIP} w-full ${slug === item.slug ? CLASE_CHIP_ACTIVO : ''}`}
                  >
                    <span className="block font-medium">{item.nombrePlural ?? item.nombre}</span>
                    {item.descripcion ? (
                      <span className="mt-0.5 block text-sm text-(--color-tinta-suave)">
                        {item.descripcion}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              {enCaptura.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSlug(item.slug)
                      setError(undefined)
                    }}
                    className={`${CLASE_CHIP} w-full ${slug === item.slug ? CLASE_CHIP_ACTIVO : ''}`}
                  >
                    <span className="block font-medium">{item.nombrePlural ?? item.nombre}</span>
                    <span className="mt-0.5 block text-sm text-(--color-tinta-suave)">
                      Lista de espera
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          {comunas.length > 0 ? (
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

          {error ? <p className="text-sm text-(--color-rojo)">{error}</p> : null}

          <button type="submit" className={CLASE_BOTON}>
            Cotizar
          </button>
        </div>
      </form>
    </Aparecer>
  )
}
