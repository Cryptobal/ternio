'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  destinoSelector,
  type RubroSelector,
} from '@/lib/selector-cotizacion'

const claseCampo =
  'w-full min-h-11 rounded-2xl border border-(--color-borde) bg-white px-3 py-2.5 text-base ' +
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-ambar)'

export function SelectorCotizacion({ rubros }: { rubros: RubroSelector[] }) {
  const router = useRouter()
  const enVenta = rubros.filter((rubro) => rubro.modo === 'VENTA')
  const enCaptura = rubros.filter((rubro) => rubro.modo === 'CAPTURA')
  const [slug, setSlug] = useState(enVenta[0]?.slug ?? enCaptura[0]?.slug ?? '')
  const [comunaSlug, setComunaSlug] = useState('')

  const rubro = useMemo(
    () => rubros.find((item) => item.slug === slug) ?? null,
    [rubros, slug],
  )

  const comunas = rubro?.modo === 'VENTA' ? (rubro.comunas ?? []) : []
  const mostrarComuna = comunas.length > 0

  function ir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rubro) return
    router.push(destinoSelector(rubro, mostrarComuna ? comunaSlug || undefined : undefined))
  }

  if (rubros.length === 0) return null

  return (
    <form
      onSubmit={ir}
      className="rounded-2xl border border-(--color-borde) bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
              setComunaSlug('')
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

        {mostrarComuna ? (
          <div>
            <label htmlFor="selector-comuna" className="mb-1 block text-sm font-medium">
              Comuna
            </label>
            <select
              id="selector-comuna"
              name="comuna"
              className={claseCampo}
              value={comunaSlug}
              onChange={(event) => setComunaSlug(event.target.value)}
            >
              <option value="">Todas las comunas</option>
              {comunas.map((comuna) => (
                <option key={comuna.slug} value={comuna.slug}>
                  {comuna.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

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
