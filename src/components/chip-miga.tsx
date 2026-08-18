'use client'

import { CLASE_MIGA } from '@/lib/ui'

export function ChipMiga({
  children,
  onQuitar,
}: {
  children: React.ReactNode
  onQuitar: () => void
}) {
  const etiqueta = typeof children === 'string' ? children : 'selección'
  return (
    <button
      type="button"
      onClick={onQuitar}
      className={CLASE_MIGA}
      aria-label={`Quitar ${etiqueta}`}
    >
      <span>{children}</span>
      <span aria-hidden="true">×</span>
    </button>
  )
}
