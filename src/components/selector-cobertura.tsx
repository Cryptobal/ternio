'use client'

import { useMemo } from 'react'

import {
  claveProvincia,
  etiquetaModoCobertura,
  type ModoCobertura,
  type SeleccionCobertura,
} from '@/lib/cobertura'
import { provinciasDe, regionesDe, type ComunaTerritorio } from '@/lib/territorio'
import { SelectorTerritorio } from '@/components/selector-territorio'

const claseChip =
  'min-h-11 rounded-2xl border border-(--color-borde) bg-white px-4 py-3 text-left text-base transition hover:border-(--color-marca)'

const MODOS: ModoCobertura[] = ['nacional', 'region', 'provincia', 'comuna']

function Chip({
  seleccionado,
  children,
  onClick,
}: {
  seleccionado?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${claseChip} ${seleccionado ? 'border-(--color-marca) bg-(--color-ambar-suave)' : ''}`}
    >
      {children}
    </button>
  )
}

export function SelectorCobertura({
  comunas,
  value,
  onChange,
}: {
  comunas: ComunaTerritorio[]
  value: SeleccionCobertura
  onChange: (siguiente: SeleccionCobertura) => void
}) {
  const regiones = useMemo(() => regionesDe(comunas), [comunas])
  const provincias = useMemo(() => {
    if (value.modo !== 'provincia' || value.regiones.length !== 1) return []
    return provinciasDe(comunas, value.regiones[0] ?? '')
  }, [comunas, value.modo, value.regiones])

  function setModo(modo: ModoCobertura) {
    onChange({ modo, regiones: [], provincias: [], comunas: [] })
  }

  function toggleRegion(region: string) {
    const tiene = value.regiones.includes(region)
    onChange({
      ...value,
      regiones: tiene ? value.regiones.filter((item) => item !== region) : [...value.regiones, region],
    })
  }

  function elegirRegionProvincia(region: string) {
    onChange({ ...value, regiones: region ? [region] : [], provincias: [] })
  }

  function toggleProvincia(region: string, provincia: string) {
    const clave = claveProvincia({ region, provincia })
    const tiene = value.provincias.some((item) => claveProvincia(item) === clave)
    onChange({
      ...value,
      provincias: tiene
        ? value.provincias.filter((item) => claveProvincia(item) !== clave)
        : [...value.provincias, { region, provincia }],
    })
  }

  return (
    <div className="grid gap-3">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Cobertura</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODOS.map((modo) => (
            <Chip key={modo} seleccionado={value.modo === modo} onClick={() => setModo(modo)}>
              {etiquetaModoCobertura(modo)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {value.modo === 'nacional' ? (
        <p className="text-sm text-(--color-tinta-suave)">Cubres todo Chile.</p>
      ) : null}

      {value.modo === 'region' ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Regiones</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {regiones.map((region) => (
              <li key={region}>
                <Chip seleccionado={value.regiones.includes(region)} onClick={() => toggleRegion(region)}>
                  {region}
                </Chip>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {value.modo === 'provincia' ? (
        <div className="grid gap-3">
          <div>
            <label htmlFor="cobertura-region" className="mb-1 block text-sm font-medium">
              Región
            </label>
            <select
              id="cobertura-region"
              className="w-full min-h-11 rounded-2xl border border-(--color-borde) bg-white px-3 py-2.5 text-base"
              value={value.regiones[0] ?? ''}
              onChange={(event) => elegirRegionProvincia(event.target.value)}
            >
              <option value="">Elige una región</option>
              {regiones.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          {value.regiones[0] ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Provincias</legend>
              <ul className="grid gap-2">
                {provincias.map((provincia) => (
                  <li key={provincia}>
                    <Chip
                      seleccionado={value.provincias.some(
                        (item) => item.region === value.regiones[0] && item.provincia === provincia,
                      )}
                      onClick={() => toggleProvincia(value.regiones[0] ?? '', provincia)}
                    >
                      {provincia}
                    </Chip>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : (
            <p className="text-sm text-(--color-tinta-suave)">Primero elige la región.</p>
          )}
        </div>
      ) : null}

      {value.modo === 'comuna' ? (
        <SelectorTerritorio
          comunas={comunas}
          multiple
          values={value.comunas}
          onChangeMultiple={(comunasElegidas) => onChange({ ...value, comunas: comunasElegidas })}
          idPrefijo="cobertura"
        />
      ) : null}
    </div>
  )
}
