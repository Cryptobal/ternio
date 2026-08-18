'use client'

import { CLASE_MIGA, CLASE_MIGA_NAVY } from '@/lib/ui'

export function ChipMiga({
  children,
  onQuitar,
  variante = 'claro',
}: {
  children: React.ReactNode
  onQuitar: () => void
  variante?: 'claro' | 'navy'
}) {
  const etiqueta = typeof children === 'string' ? children : 'selección'
  return (
    <button
      type="button"
      onClick={onQuitar}
      className={variante === 'navy' ? CLASE_MIGA_NAVY : CLASE_MIGA}
      aria-label={`Quitar ${etiqueta}`}
    >
      <span>{children}</span>
      <span aria-hidden="true">×</span>
    </button>
  )
}
