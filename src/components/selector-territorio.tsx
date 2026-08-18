'use client'

import { useMemo, useState } from 'react'

import { PasoAnimado } from '@/components/ui/motion'
import {
  comunaPorSlug,
  comunasDe,
  pasoTerritorio,
  provinciasDe,
  regionesDe,
  type ComunaTerritorio,
} from '@/lib/territorio'
import { CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_PASO_ACTIVO } from '@/lib/ui'

const CLASE_LISTA =
  'grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2'

function ChipOpcion({
  seleccionado,
  onClick,
  children,
}: {
  seleccionado: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={seleccionado}
        onClick={onClick}
        className={`${CLASE_CHIP} w-full ${seleccionado ? CLASE_CHIP_ACTIVO : ''}`}
      >
        {children}
      </button>
    </li>
  )
}

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

  function elegirRegion(nombre: string) {
    setRegion(nombre)
    setProvincia('')
    if (!multiple) onChange?.('')
  }

  function elegirProvincia(nombre: string) {
    setProvincia(nombre)
    if (!multiple) onChange?.('')
  }

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
      <fieldset className={paso === 'region' ? `rounded-2xl ${CLASE_PASO_ACTIVO} p-1` : ''}>
        <legend id={`${idPrefijo}-region`} className="mb-2 text-sm font-medium">
          Región
        </legend>
        <ul className={CLASE_LISTA} role="list">
          {regiones.map((nombre) => (
            <ChipOpcion
              key={nombre}
              seleccionado={region === nombre}
              onClick={() => elegirRegion(nombre)}
            >
              {nombre}
            </ChipOpcion>
          ))}
        </ul>
      </fieldset>

      {region ? (
        <PasoAnimado id={`${idPrefijo}-provincia-${region}`}>
          <fieldset className={paso === 'provincia' ? `rounded-2xl ${CLASE_PASO_ACTIVO} p-1` : ''}>
            <legend id={`${idPrefijo}-provincia`} className="mb-2 text-sm font-medium">
              Provincia
            </legend>
            <ul className={CLASE_LISTA} role="list">
              {provincias.map((nombre) => (
                <ChipOpcion
                  key={nombre}
                  seleccionado={provincia === nombre}
                  onClick={() => elegirProvincia(nombre)}
                >
                  {nombre}
                </ChipOpcion>
              ))}
            </ul>
          </fieldset>
        </PasoAnimado>
      ) : (
        <p className="text-sm text-(--color-tinta-suave)">Primero elige la región.</p>
      )}

      {region && provincia ? (
        <PasoAnimado id={`${idPrefijo}-comuna-${region}-${provincia}`}>
          {multiple ? (
            <fieldset
              className={
                paso === 'comuna' || paso === 'listo'
                  ? `rounded-2xl ${paso === 'comuna' ? CLASE_PASO_ACTIVO : ''} p-1`
                  : ''
              }
            >
              <legend className="mb-2 text-sm font-medium">Comunas</legend>
              {listaComunas.length === 0 ? (
                <p className="text-sm text-(--color-tinta-suave)">No hay comunas en esta provincia.</p>
              ) : (
                <ul className={CLASE_LISTA}>
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
            <fieldset className={paso === 'comuna' ? `rounded-2xl ${CLASE_PASO_ACTIVO} p-1` : ''}>
              <legend id={`${idPrefijo}-comuna`} className="mb-2 text-sm font-medium">
                Comuna
              </legend>
              <ul className={CLASE_LISTA} role="list">
                {listaComunas.map((comuna) => (
                  <ChipOpcion
                    key={comuna.slug}
                    seleccionado={value === comuna.slug}
                    onClick={() => elegir(comuna)}
                  >
                    {comuna.nombre}
                  </ChipOpcion>
                ))}
              </ul>
            </fieldset>
          )}
        </PasoAnimado>
      ) : region ? (
        <p className="text-sm text-(--color-tinta-suave)">Primero elige la provincia.</p>
      ) : null}
    </div>
  )
}
