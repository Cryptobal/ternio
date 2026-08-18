'use client'

import { useMemo, useState } from 'react'

import { ChipMiga } from '@/components/chip-miga'
import { PasoAnimado } from '@/components/ui/motion'
import {
  comunaPorSlug,
  comunasDe,
  debeMostrarNivelTerritorio,
  nivelListaTerritorio,
  preguntaNivelTerritorio,
  provinciasDe,
  regionesDe,
  type ComunaTerritorio,
  type NivelListaTerritorio,
} from '@/lib/territorio'
import {
  CLASE_CHIP,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_NAVY,
  CLASE_CHIP_NAVY_ACTIVO,
  CLASE_LEYENDA_NAVY,
} from '@/lib/ui'

const CLASE_LISTA = 'grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2'

export type VarianteTerritorio = 'claro' | 'navy'

function ChipOpcion({
  seleccionado,
  onClick,
  children,
  variante,
}: {
  seleccionado: boolean
  onClick: () => void
  children: React.ReactNode
  variante: VarianteTerritorio
}) {
  const base = variante === 'navy' ? CLASE_CHIP_NAVY : CLASE_CHIP
  const activo = variante === 'navy' ? CLASE_CHIP_NAVY_ACTIVO : CLASE_CHIP_ACTIVO
  return (
    <li>
      <button
        type="button"
        aria-pressed={seleccionado}
        onClick={onClick}
        className={`${base} w-full ${seleccionado ? activo : ''}`}
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
  variante = 'claro',
}: {
  comunas: ComunaTerritorio[]
  value?: string
  onChange?: (slug: string) => void
  idPrefijo?: string
  multiple?: boolean
  values?: string[]
  onChangeMultiple?: (slugs: string[]) => void
  variante?: VarianteTerritorio
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
  const comunaSlug = multiple ? (values[0] ?? '') : (value ?? '')
  const opciones = { multiple }
  const nivel = nivelListaTerritorio(region, provincia, comunaSlug, opciones)
  const mostrarRegion = debeMostrarNivelTerritorio('region', region, provincia, comunaSlug, opciones)
  const mostrarProvincia = debeMostrarNivelTerritorio(
    'provincia',
    region,
    provincia,
    comunaSlug,
    opciones,
  )
  const mostrarComuna = debeMostrarNivelTerritorio('comuna', region, provincia, comunaSlug, opciones)
  const comunaElegida = !multiple && value ? comunaPorSlug(comunas, value) : undefined

  function limpiarComunas() {
    if (multiple) onChangeMultiple?.([])
    else onChange?.('')
  }

  function elegirRegion(nombre: string) {
    setRegion(nombre)
    setProvincia('')
    limpiarComunas()
  }

  function elegirProvincia(nombre: string) {
    setProvincia(nombre)
    limpiarComunas()
  }

  function quitarRegion() {
    setRegion('')
    setProvincia('')
    limpiarComunas()
  }

  function quitarProvincia() {
    setProvincia('')
    limpiarComunas()
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
    <div className="grid gap-3">
      {region || provincia || comunaElegida ? (
        <div className="flex flex-wrap gap-2">
          {region ? (
            <ChipMiga variante={variante} onQuitar={quitarRegion}>
              {region}
            </ChipMiga>
          ) : null}
          {provincia ? (
            <ChipMiga variante={variante} onQuitar={quitarProvincia}>
              {provincia}
            </ChipMiga>
          ) : null}
          {comunaElegida ? (
            <ChipMiga variante={variante} onQuitar={() => onChange?.('')}>
              {comunaElegida.nombre}
            </ChipMiga>
          ) : null}
        </div>
      ) : null}

      <PasoAnimado id={`${idPrefijo}-${nivel ?? 'listo'}`}>
        {mostrarRegion ? (
          <ListaNivel
            id={`${idPrefijo}-region`}
            nivel="region"
            variante={variante}
            items={regiones.map((nombre) => ({
              clave: nombre,
              etiqueta: nombre,
              seleccionado: region === nombre,
              onClick: () => elegirRegion(nombre),
            }))}
          />
        ) : null}

        {mostrarProvincia ? (
          <ListaNivel
            id={`${idPrefijo}-provincia`}
            nivel="provincia"
            variante={variante}
            items={provincias.map((nombre) => ({
              clave: nombre,
              etiqueta: nombre,
              seleccionado: provincia === nombre,
              onClick: () => elegirProvincia(nombre),
            }))}
          />
        ) : null}

        {mostrarComuna ? (
          multiple ? (
            <fieldset>
              <legend
                id={`${idPrefijo}-comuna`}
                className={variante === 'navy' ? CLASE_LEYENDA_NAVY : 'mb-2 text-sm font-medium'}
              >
                {preguntaNivelTerritorio('comuna')}
              </legend>
              {listaComunas.length === 0 ? (
                <p
                  className={
                    variante === 'navy'
                      ? 'text-sm text-white/65'
                      : 'text-sm text-(--color-tinta-suave)'
                  }
                >
                  No hay comunas en esta provincia.
                </p>
              ) : (
                <ul className={CLASE_LISTA}>
                  {listaComunas.map((comuna) => (
                    <li key={comuna.slug}>
                      <label
                        className={`${variante === 'navy' ? CLASE_CHIP_NAVY : CLASE_CHIP} flex items-center gap-3 ${seleccionadas.has(comuna.slug) ? (variante === 'navy' ? CLASE_CHIP_NAVY_ACTIVO : CLASE_CHIP_ACTIVO) : ''}`}
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
                <p
                  className={
                    variante === 'navy'
                      ? 'mt-2 text-sm text-white/65'
                      : 'mt-2 text-sm text-(--color-tinta-suave)'
                  }
                >
                  {values.length} {values.length === 1 ? 'comuna elegida' : 'comunas elegidas'}.
                </p>
              ) : null}
            </fieldset>
          ) : (
            <ListaNivel
              id={`${idPrefijo}-comuna`}
              nivel="comuna"
              variante={variante}
              items={listaComunas.map((comuna) => ({
                clave: comuna.slug,
                etiqueta: comuna.nombre,
                seleccionado: value === comuna.slug,
                onClick: () => elegir(comuna),
              }))}
            />
          )
        ) : null}
      </PasoAnimado>
    </div>
  )
}

function ListaNivel({
  id,
  nivel,
  items,
  variante,
}: {
  id: string
  nivel: NivelListaTerritorio
  items: { clave: string; etiqueta: string; seleccionado: boolean; onClick: () => void }[]
  variante: VarianteTerritorio
}) {
  return (
    <fieldset>
      <legend id={id} className={variante === 'navy' ? CLASE_LEYENDA_NAVY : 'mb-2 text-sm font-medium'}>
        {preguntaNivelTerritorio(nivel)}
      </legend>
      <ul className={CLASE_LISTA} role="list">
        {items.map((item) => (
          <ChipOpcion
            key={item.clave}
            seleccionado={item.seleccionado}
            onClick={item.onClick}
            variante={variante}
          >
            {item.etiqueta}
          </ChipOpcion>
        ))}
      </ul>
    </fieldset>
  )
}
