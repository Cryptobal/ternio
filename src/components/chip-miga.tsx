'use client'

import { CLASE_MIGA } from '@/lib/ui'

export function ChipMiga({
  children,
  onQuitar,
}: {
  children: React.ReactNode
  onQuitar: () => void
}) {
  return (
    <button type="button" onClick={onQuitar} className={CLASE_MIGA}>
      <span>{children}</span>
      <span aria-hidden="true">×</span>
    </button>
  )
}
