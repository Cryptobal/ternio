'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { SelectorTerritorio } from '@/components/selector-territorio'
import { destinoSelector } from '@/lib/selector-cotizacion'
import type { ComunaTerritorio } from '@/lib/territorio'
import { CLASE_BOTON, CLASE_SUPERFICIE } from '@/lib/ui'

export function SelectorComunaCta({
  rubroSlug,
  rubroModo,
  comunas,
  publicados,
  etiquetaCta = 'Pedir cotización',
}: {
  rubroSlug: string
  rubroModo: 'VENTA' | 'CAPTURA'
  comunas: ComunaTerritorio[]
  publicados: string[]
  etiquetaCta?: string
}) {
  const router = useRouter()
  const [comunaSlug, setComunaSlug] = useState('')
  const [error, setError] = useState<string | undefined>()

  function ir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!comunaSlug) {
      setError('Elige una comuna.')
      return
    }
    const publicado = publicados.includes(`${rubroSlug}/${comunaSlug}`)
    router.push(destinoSelector({ slug: rubroSlug, modo: rubroModo }, comunaSlug, publicado))
  }

  return (
    <form onSubmit={ir} className="rounded-2xl border border-(--color-borde) bg-white p-5">
      <SelectorTerritorio
        comunas={comunas}
        value={comunaSlug}
        onChange={(siguiente) => {
          setComunaSlug(siguiente)
          setError(undefined)
        }}
        idPrefijo="rubro-comuna"
      />
      {error ? <p className="mt-2 text-sm text-(--color-rojo)">{error}</p> : null}
      <button
        type="submit"
        className="mt-4 min-h-12 w-full rounded-2xl bg-(--color-marca) px-5 py-3 font-semibold text-white"
      >
        {etiquetaCta}
      </button>
    </form>
  )
}
