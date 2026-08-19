'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { IconoCasa, IconoEmpresa } from '@/components/iconos-audiencia'
import {
  filtrarServiciosPorAudiencia,
  filtrarServiciosPorTexto,
  type Audiencia,
} from '@/lib/audiencia'
import { CLASE_CAMPO, CLASE_CHIP, CLASE_CHIP_ACTIVO } from '@/lib/ui'

export type ItemCatalogoHome = {
  slug: string
  nombre: string
  modo: string
  audiencias: readonly string[]
  href: string | null
}

export function CatalogoHome({
  rubros,
  notaEspera,
}: {
  rubros: ItemCatalogoHome[]
  notaEspera: string
}) {
  const [audiencia, setAudiencia] = useState<Audiencia>('empresa')
  const [query, setQuery] = useState('')

  const filtrados = useMemo(() => {
    const porAud = filtrarServiciosPorAudiencia(
      rubros.map((r) => ({ ...r, audiencias: r.audiencias })),
      audiencia,
    )
    return filtrarServiciosPorTexto(porAud, query)
  }, [rubros, audiencia, query])

  const hayCaptura = filtrados.some((r) => r.modo === 'CAPTURA')

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(['empresa', 'hogar'] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={audiencia === a}
            onClick={() => setAudiencia(a)}
            className={`${CLASE_CHIP} inline-flex min-h-11 items-center gap-2 ${audiencia === a ? CLASE_CHIP_ACTIVO : ''}`}
          >
            {a === 'hogar' ? <IconoCasa tamano={18} /> : <IconoEmpresa tamano={18} />}
            {a === 'hogar' ? 'Casa' : 'Empresa'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="buscar-catalogo" className="sr-only">
          Buscar servicio
        </label>
        <input
          id="buscar-catalogo"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar un servicio"
          className={CLASE_CAMPO}
        />
      </div>

      <ul className="rejilla-fichas mt-6">
        {filtrados.map((item) => {
          const apagado = item.modo === 'CAPTURA'
          const clase = `ficha-simetrica ${apagado ? 'opacity-80' : ''}`
          const cuerpo = (
            <>
              <span
                className={`ficha-simetrica__punto ${apagado ? 'ficha-simetrica__punto--apagado' : ''}`}
                aria-hidden="true"
              />
              <span className="ficha-simetrica__texto">{item.nombre}</span>
            </>
          )
          return (
            <li key={item.slug}>
              {item.href && !apagado ? (
                <Link href={item.href} className={clase}>
                  {cuerpo}
                </Link>
              ) : (
                <a href="#cotizador" className={clase}>
                  {cuerpo}
                </a>
              )}
            </li>
          )
        })}
      </ul>

      {filtrados.length === 0 ? (
        <p className="mt-4 text-sm text-(--color-texto-suave)">
          No hay un servicio con ese nombre. Cotiza igual desde el selector de arriba.
        </p>
      ) : null}

      {hayCaptura ? (
        <p className="mt-4 text-sm text-(--color-texto-suave)">{notaEspera}</p>
      ) : null}
    </div>
  )
}
