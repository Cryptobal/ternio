'use client'

import { useMemo, useState } from 'react'

import {
  comunaPorSlug,
  comunasDe,
  provinciasDe,
  regionesDe,
  type ComunaTerritorio,
} from '@/lib/territorio'

const claseCampo =
  'w-full min-h-11 rounded-2xl border border-(--color-borde) bg-white px-3 py-2.5 text-base outline-none'

export function SelectorTerritorio({
  comunas,
  value,
  onChange,
  idPrefijo = 'territorio',
  multiple = false,
  values = [],
  onChangeMultiple,
}: {
  comunas: ComunaTerritorio[]
  value?: string
  onChange?: (slug: string) => void
  idPrefijo?: string
  multiple?: boolean
  values?: string[]
  onChangeMultiple?: (slugs: string[]) => void
}) {
  const elegida = value ? comunaPorSlug(comunas, value) : undefined
  const [region, setRegion] = useState(elegida?.region ?? '')
  const [provincia, setProvincia] = useState(elegida?.provincia ?? '')

  const regiones = useMemo(() => regionesDe(comunas), [comunas])
  const provincias = useMemo(
    () => (region ? provinciasDe(comunas, region) : []),
    [comunas, region],
  )
  const listaComunas = useMemo(
    () => (region && provincia ? comunasDe(comunas, region, provincia) : []),
    [comunas, region, provincia],
  )

  const seleccionadas = new Set(multiple ? values : value ? [value] : [])

  function elegir(comuna: ComunaTerritorio) {
    setRegion(comuna.region)
    setProvincia(comuna.provincia)
    if (multiple) {
      const siguiente = seleccionadas.has(comuna.slug)
        ? values.filter((slug) => slug !== comuna.slug)
        : [...values, comuna.slug]
      onChangeMultiple?.(siguiente)
      return
    }
    onChange?.(comuna.slug)
  }

  return (
    <div className="grid gap-3">
      <div>
        <label htmlFor={`${idPrefijo}-region`} className="mb-1 block text-sm font-medium">
          Región
        </label>
        <select
          id={`${idPrefijo}-region`}
          className={claseCampo}
          value={region}
          onChange={(event) => {
            setRegion(event.target.value)
            setProvincia('')
            if (!multiple) onChange?.('')
          }}
        >
          <option value="">Elige una región</option>
          {regiones.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefijo}-provincia`} className="mb-1 block text-sm font-medium">
          Provincia
        </label>
        <select
          id={`${idPrefijo}-provincia`}
          className={claseCampo}
          value={provincia}
          disabled={!region}
          onChange={(event) => {
            setProvincia(event.target.value)
            if (!multiple) onChange?.('')
          }}
        >
          <option value="">{region ? 'Elige una provincia' : 'Primero elige la región'}</option>
          {provincias.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      {multiple ? (
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Comunas</legend>
          {listaComunas.length === 0 ? (
            <p className="text-sm text-(--color-tinta-suave)">
              Elige región y provincia para ver las comunas.
            </p>
          ) : (
            <ul className="grid gap-2">
              {listaComunas.map((comuna) => (
                <li key={comuna.slug}>
                  <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-(--color-borde) bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(comuna.slug)}
                      onChange={() => elegir(comuna)}
                    />
                    <span>{comuna.nombre}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {values.length > 0 ? (
            <p className="mt-2 text-sm text-(--color-tinta-suave)">
              {values.length} {values.length === 1 ? 'comuna elegida' : 'comunas elegidas'}.
            </p>
          ) : null}
        </fieldset>
      ) : (
        <div>
          <label htmlFor={`${idPrefijo}-comuna`} className="mb-1 block text-sm font-medium">
            Comuna
          </label>
          <select
            id={`${idPrefijo}-comuna`}
            className={claseCampo}
            value={value ?? ''}
            disabled={!provincia}
            onChange={(event) => onChange?.(event.target.value)}
          >
            <option value="">
              {provincia ? 'Elige una comuna' : 'Primero elige la provincia'}
            </option>
            {listaComunas.map((comuna) => (
              <option key={comuna.slug} value={comuna.slug}>
                {comuna.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
