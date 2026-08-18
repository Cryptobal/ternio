'use client'

import { useMemo } from 'react'

import { ChipMiga } from '@/components/chip-miga'
import { PasoAnimado } from '@/components/ui/motion'
import {
  claveProvincia,
  etiquetaModoCobertura,
  type ModoCobertura,
  type SeleccionCobertura,
} from '@/lib/cobertura'
import { provinciasDe, regionesDe, territorioUnPasoVisible, type ComunaTerritorio } from '@/lib/territorio'
import { SelectorTerritorio } from '@/components/selector-territorio'
import { CLASE_CHIP, CLASE_CHIP_ACTIVO } from '@/lib/ui'

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
      className={`${CLASE_CHIP} w-full ${seleccionado ? CLASE_CHIP_ACTIVO : ''}`}
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
          {value.regiones[0] ? (
            <ChipMiga
              etiqueta={value.regiones[0]}
              onQuitar={() => elegirRegionProvincia('')}
              ariaLabel="Cambiar región"
            />
          ) : null}
          <PasoAnimado id={`cobertura-provincia-${value.regiones[0] || 'region'}`}>
            {territorioUnPasoVisible(value.regiones[0] ?? '', '', '').region ? (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Región</legend>
                <ul className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {regiones.map((region) => (
                    <li key={region}>
                      <Chip
                        seleccionado={value.regiones[0] === region}
                        onClick={() => elegirRegionProvincia(region)}
                      >
                        {region}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : (
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
            )}
          </PasoAnimado>
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
