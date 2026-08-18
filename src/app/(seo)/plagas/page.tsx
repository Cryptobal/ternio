import type { Metadata } from 'next'

import PaginaRubro, { generateMetadata as metadataRubro } from '../[rubro]/page'

/**
 * Ruta fija `/plagas`. El slug en BD del seed es `control-de-plagas`;
 * `slugsBdCandidatos` también acepta `plagas`. No depende de que
 * `[rubro]` haya generado el param en el build (eso dejaba 404 en prod).
 */
export const dynamic = 'force-dynamic'

const PARAMS_PLAGAS = Promise.resolve({ rubro: 'plagas' })

type Props = { searchParams: Promise<{ comuna?: string }> }

export function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadataRubro({ params: PARAMS_PLAGAS, searchParams })
}

export default function PaginaPlagas({ searchParams }: Props) {
  return PaginaRubro({ params: PARAMS_PLAGAS, searchParams })
}
