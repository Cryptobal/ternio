'use client'

import { useMemo, useState } from 'react'

import type { Audiencia } from '@/lib/audiencia'
import {
  escalonesFrescura,
  preciosPorAudiencia,
  rubroAtiendeAmbas,
  type PrecioMostrable,
} from '@/lib/contenido-precios'
import { formatearClp } from '@/lib/dinero'
import { CLASE_CHIP, CLASE_CHIP_ACTIVO } from '@/lib/ui'

export function SelectorPrecios({ rubros }: { rubros: PrecioMostrable[] }) {
  const [slug, setSlug] = useState(rubros[0]?.slug ?? '')
  const rubro = useMemo(() => rubros.find((r) => r.slug === slug) ?? rubros[0], [rubros, slug])
  const ambas = rubro ? rubroAtiendeAmbas(rubro) : false
  const [audiencia, setAudiencia] = useState<Audiencia>('empresa')

  if (!rubro) {
    return (
      <p className="rounded-2xl border border-(--color-borde) bg-(--color-superficie) p-5 text-(--color-texto-suave)">
        Todavía no hay servicios abiertos a la venta.
      </p>
    )
  }

  const audienciaEfectiva: Audiencia =
    ambas && audiencia === 'hogar' && rubro.compartidoHogar != null ? 'hogar' : 'empresa'
  const precios = preciosPorAudiencia(rubro, audienciaEfectiva)
  if (!precios) return null

  const escalones = escalonesFrescura(precios.compartido)

  return (
    <div>
      <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Elige un servicio</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rubros.map((r) => (
          <button
            key={r.slug}
            type="button"
            onClick={() => {
              setSlug(r.slug)
              setAudiencia('empresa')
            }}
            className={`${CLASE_CHIP} ${r.slug === rubro.slug ? CLASE_CHIP_ACTIVO : ''}`}
          >
            {r.nombre}
          </button>
        ))}
      </div>

      {ambas && rubro.compartidoHogar != null && rubro.exclusivoHogar != null ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Audiencia del precio">
          {(['empresa', 'hogar'] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={audienciaEfectiva === a}
              onClick={() => setAudiencia(a)}
              className={`${CLASE_CHIP} ${audienciaEfectiva === a ? CLASE_CHIP_ACTIVO : ''}`}
            >
              {a === 'hogar' ? 'Casa' : 'Empresa'}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-(--color-borde) bg-(--color-superficie) p-6">
          <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Compartido</p>
          <p className="font-display mt-2 text-3xl">{formatearClp(precios.compartido)}</p>
          <p className="mt-2 text-sm text-(--color-texto-suave)">
            Hasta tres empresas. El comprador recibe como máximo tres llamados.
          </p>
        </div>
        <div className="rounded-3xl border border-(--color-borde) bg-(--color-superficie) p-6">
          <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Exclusivo</p>
          <p className="font-display mt-2 text-3xl">{formatearClp(precios.exclusivo)}</p>
          <p className="mt-2 text-sm text-(--color-texto-suave)">
            Cierras el contacto para el resto. Solo tú hablas con el comprador.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-xl">El precio baja con el tiempo</h3>
        <p className="mt-2 text-sm text-(--color-texto-suave)">
          Sobre el precio base de compartido ({formatearClp(precios.compartido)}).
        </p>
        <ul className="mt-4 grid gap-3">
          {escalones.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--color-borde) bg-(--color-superficie) px-4 py-3"
            >
              <span className="min-w-[7rem] text-sm font-medium">{e.etiqueta}</span>
              <div className="h-2 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-(--color-superficie-2)">
                <div
                  className="h-full rounded-full bg-(--color-ambar)"
                  style={{ width: `${e.barraPct}%` }}
                />
              </div>
              <span className="text-sm text-(--color-texto-suave)">
                {e.factor == null
                  ? 'No se ofrece'
                  : e.precioEjemplo != null
                    ? formatearClp(e.precioEjemplo)
                    : `${Math.round(e.factor * 100)} %`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
