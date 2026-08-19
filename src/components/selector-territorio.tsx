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
  slugificarNombre,
  type ComunaTerritorio,
  type NivelListaTerritorio,
} from '@/lib/territorio'
import {
  CLASE_CAMPO,
  CLASE_CAMPO_NAVY,
  CLASE_CHIP,
  CLASE_CHIP_ACTIVO,
  CLASE_CHIP_NAVY,
  CLASE_CHIP_NAVY_ACTIVO,
  CLASE_LEYENDA_NAVY,
} from '@/lib/ui'

/** Sin max-h mudo: listas cortas; jerarquía completa sin recorte artificial. */
const CLASE_LISTA = 'grid gap-2 sm:grid-cols-2'

const SLUGS_FRECUENTES = [
  'santiago',
  'las-condes',
  'providencia',
  'maipu',
  'nunoa',
  'puente-alto',
  'vina-del-mar',
  'concepcion',
] as const

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
  frecuentes = false,
}: {
  comunas: ComunaTerritorio[]
  value?: string
  onChange?: (slug: string) => void
  idPrefijo?: string
  multiple?: boolean
  values?: string[]
  onChangeMultiple?: (slugs: string[]) => void
  variante?: VarianteTerritorio
  /** Buscador + chips frecuentes primero (cotizador público). */
  frecuentes?: boolean
}) {
  const elegida = value ? comunaPorSlug(comunas, value) : undefined
  const [region, setRegion] = useState(elegida?.region ?? '')
  const [provincia, setProvincia] = useState(elegida?.provincia ?? '')
  const [busqueda, setBusqueda] = useState('')
  const [verMas, setVerMas] = useState(false)

  const regiones = useMemo(() => regionesDe(comunas), [comunas])
  const provincias = useMemo(
    () => (region ? provinciasDe(comunas, region) : []),
    [comunas, region],
  )
  const listaComunas = useMemo(
    () => (region && provincia ? comunasDe(comunas, region, provincia) : []),
    [comunas, region, provincia],
  )

  const chipsFrecuentes = useMemo(() => {
    const porSlug = new Map(comunas.map((c) => [c.slug, c]))
    return SLUGS_FRECUENTES.map((slug) => porSlug.get(slug)).filter(
      (c): c is ComunaTerritorio => Boolean(c),
    )
  }, [comunas])

  const coincidencias = useMemo(() => {
    const q = slugificarNombre(busqueda.trim())
    if (!q) return []
    return comunas
      .filter((c) => {
        const hay = `${slugificarNombre(c.nombre)} ${slugificarNombre(c.region)} ${slugificarNombre(c.provincia)} ${c.slug}`
        return hay.includes(q)
      })
      .slice(0, 7)
  }, [comunas, busqueda])

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

  const campoClase = variante === 'navy' ? CLASE_CAMPO_NAVY : CLASE_CAMPO
  const suave =
    variante === 'navy' ? 'text-sm text-white/65' : 'text-sm text-(--color-texto-suave)'
  const leyenda = variante === 'navy' ? CLASE_LEYENDA_NAVY : 'mb-2 text-sm font-medium'

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
    setBusqueda('')
    if (multiple) {
      const siguiente = seleccionadas.has(comuna.slug)
        ? values.filter((slug) => slug !== comuna.slug)
        : [...values, comuna.slug]
      onChangeMultiple?.(siguiente)
      return
    }
    onChange?.(comuna.slug)
  }

  const modoRapido = frecuentes && !multiple && !verMas

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

      {modoRapido ? (
        <div className="grid gap-3">
          <div>
            <label htmlFor={`${idPrefijo}-buscar`} className={`block ${leyenda}`}>
              ¿En qué comuna?
            </label>
            <input
              id={`${idPrefijo}-buscar`}
              type="search"
              autoComplete="off"
              value={busqueda}
              placeholder="Escribe tu comuna"
              onChange={(e) => setBusqueda(e.target.value)}
              className={campoClase}
            />
          </div>

          {busqueda.trim() ? (
            coincidencias.length > 0 ? (
              <ul className={CLASE_LISTA} role="list">
                {coincidencias.map((comuna) => (
                  <ChipOpcion
                    key={comuna.slug}
                    seleccionado={value === comuna.slug}
                    onClick={() => elegir(comuna)}
                    variante={variante}
                  >
                    {comuna.nombre}
                  </ChipOpcion>
                ))}
              </ul>
            ) : (
              <p className={suave}>
                No encontramos esa comuna. Cotiza igual: la dejamos en lista de espera. O{' '}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => setVerMas(true)}
                >
                  elige por región
                </button>
                .
              </p>
            )
          ) : (
            <>
              {chipsFrecuentes.length > 0 ? (
                <div>
                  <p className={leyenda}>Comunas frecuentes</p>
                  <ul className="flex flex-wrap gap-2" role="list">
                    {chipsFrecuentes.map((comuna) => (
                      <ChipOpcion
                        key={comuna.slug}
                        seleccionado={value === comuna.slug}
                        onClick={() => elegir(comuna)}
                        variante={variante}
                      >
                        {comuna.nombre}
                      </ChipOpcion>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setVerMas(true)}
                className={
                  variante === 'navy'
                    ? 'text-left text-sm font-medium text-white/80 underline underline-offset-2'
                    : 'text-left text-sm font-medium text-(--color-marca) underline underline-offset-2'
                }
              >
                Ver más comunas
              </button>
            </>
          )}
        </div>
      ) : (
        <PasoAnimado id={`${idPrefijo}-${nivel ?? 'listo'}`}>
          {frecuentes && !multiple ? (
            <button
              type="button"
              onClick={() => {
                setVerMas(false)
                setRegion('')
                setProvincia('')
              }}
              className={
                variante === 'navy'
                  ? 'mb-2 text-left text-sm text-white/70 underline underline-offset-2'
                  : 'mb-2 text-left text-sm text-(--color-marca) underline underline-offset-2'
              }
            >
              ← Volver al buscador
            </button>
          ) : null}

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
                  <p className={suave}>No hay comunas en esta provincia.</p>
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
                  <p className={`mt-2 ${suave}`}>
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
      )}
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
