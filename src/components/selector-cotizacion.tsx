'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { SelectorTerritorio } from '@/components/selector-territorio'
import {
  claveCombo,
  destinoSelector,
  type RubroSelector,
} from '@/lib/selector-cotizacion'
import type { ComunaTerritorio } from '@/lib/territorio'

const claseCampo =
  'w-full min-h-11 rounded-2xl border border-(--color-borde) bg-white px-3 py-2.5 text-base ' +
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-ambar)'

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
    <form
      onSubmit={ir}
      className="rounded-2xl border border-(--color-borde) bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid gap-3">
        <div>
          <label htmlFor="selector-servicio" className="mb-1 block text-sm font-medium">
            Servicio
          </label>
          <select
            id="selector-servicio"
            name="servicio"
            className={claseCampo}
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value)
              setError(undefined)
            }}
          >
            {enVenta.length > 0 ? (
              <optgroup label="Disponibles">
                {enVenta.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.nombrePlural ?? item.nombre}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {enCaptura.length > 0 ? (
              <optgroup label="Próximamente">
                {enCaptura.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.nombrePlural ?? item.nombre}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </div>

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

        <button
          type="submit"
          className="min-h-11 rounded-2xl bg-(--color-marca) px-5 py-2.5 text-base font-semibold text-white transition hover:bg-(--color-tinta)"
        >
          Cotizar
        </button>
      </div>
    </form>
  )
}
