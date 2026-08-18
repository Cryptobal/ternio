'use client'

import { useMemo, useState } from 'react'

import {
  comunaPorSlug,
  comunasDe,
  pasoTerritorio,
  provinciasDe,
  regionesDe,
  type ComunaTerritorio,
} from '@/lib/territorio'
import { CLASE_CAMPO, CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_PASO_ACTIVO } from '@/lib/ui'

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
  const paso = pasoTerritorio(region, provincia, multiple ? (values[0] ?? '') : (value ?? ''))

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
    <div className="grid gap-4">
      <div className={paso === 'region' ? `rounded-2xl ${CLASE_PASO_ACTIVO} p-1` : ''}>
        <label htmlFor={`${idPrefijo}-region`} className="mb-1 block text-sm font-medium">
          Región
        </label>
        <select
          id={`${idPrefijo}-region`}
          className={CLASE_CAMPO}
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

      <div className={paso === 'provincia' ? `rounded-2xl ${CLASE_PASO_ACTIVO} p-1` : ''}>
        <label htmlFor={`${idPrefijo}-provincia`} className="mb-1 block text-sm font-medium">
          Provincia
        </label>
        <select
          id={`${idPrefijo}-provincia`}
          className={CLASE_CAMPO}
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
        <fieldset className={paso === 'comuna' || paso === 'listo' ? `rounded-2xl ${paso === 'comuna' ? CLASE_PASO_ACTIVO : ''} p-1` : ''}>
          <legend className="mb-1 text-sm font-medium">Comunas</legend>
          {listaComunas.length === 0 ? (
            <p className="text-sm text-(--color-tinta-suave)">
              Elige región y provincia para ver las comunas.
            </p>
          ) : (
            <ul className="grid gap-2">
              {listaComunas.map((comuna) => (
                <li key={comuna.slug}>
                  <label
                    className={`${CLASE_CHIP} flex items-center gap-3 ${seleccionadas.has(comuna.slug) ? CLASE_CHIP_ACTIVO : ''}`}
                  >
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
        <div className={paso === 'comuna' ? `rounded-2xl ${CLASE_PASO_ACTIVO} p-1` : ''}>
          <label htmlFor={`${idPrefijo}-comuna`} className="mb-1 block text-sm font-medium">
            Comuna
          </label>
          <select
            id={`${idPrefijo}-comuna`}
            className={CLASE_CAMPO}
            value={value ?? ''}
            disabled={!provincia}
            onChange={(event) => onChange?.(event.target.value)}
          >
            <option value="">{provincia ? 'Elige una comuna' : 'Primero elige la provincia'}</option>
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
