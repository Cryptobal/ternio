import type { Metadata } from 'next'

import PaginaCombo, { generateMetadata as metadataCombo } from '../../[rubro]/[comuna]/page'

/** `/plagas/{comuna}` — p. ej. `/plagas/santiago` si la combo está publicada. */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ comuna: string }> }

function paramsConRubro(params: Promise<{ comuna: string }>) {
  return params.then((p) => ({ rubro: 'plagas', comuna: p.comuna }))
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataCombo({ params: paramsConRubro(params) })
}

export default function PaginaPlagasComuna({ params }: Props) {
  return PaginaCombo({ params: paramsConRubro(params) })
}
