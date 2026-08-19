'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { SelectorTerritorio } from '@/components/selector-territorio'
import { combosDeLugar, LUGAR_HOME, type ComboPublicado } from '@/lib/contenido-home'
import type { ComunaTerritorio } from '@/lib/territorio'

export function SelectorLugarCombos({
  comunas,
  combos,
}: {
  comunas: ComunaTerritorio[]
  combos: ComboPublicado[]
}) {
  const [comunaSlug, setComunaSlug] = useState('')
  const enlaces = useMemo(() => combosDeLugar(combos, comunaSlug), [combos, comunaSlug])
  const comuna = comunas.find((item) => item.slug === comunaSlug)

  return (
    <div>
      <h2 className="font-display text-2xl">{LUGAR_HOME.titulo}</h2>
      <p className="mt-2 text-(--color-texto-suave)">{LUGAR_HOME.bajada}</p>
      <div className="mt-6">
        <SelectorTerritorio
          comunas={comunas}
          value={comunaSlug}
          onChange={setComunaSlug}
          idPrefijo="lugar-home"
        />
      </div>
      {comunaSlug ? (
        enlaces.length > 0 ? (
          <ul className="mt-6 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {enlaces.map((enlace) => (
              <li key={enlace.href} className="mb-2 break-inside-avoid">
                <Link
                  href={enlace.href}
                  className="text-sm font-medium text-(--color-marca) underline-offset-4 hover:underline"
                >
                  {enlace.etiqueta}
                  {comuna ? ` en ${comuna.nombre}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-(--color-texto-suave)">{LUGAR_HOME.vacio}</p>
        )
      ) : null}
    </div>
  )
}
