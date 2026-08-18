'use client'

const CLASE_MIGA =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-(--color-marca) ' +
  'bg-(--color-ambar-suave) px-3 py-1.5 text-sm font-medium'

export function ChipMiga({
  etiqueta,
  onQuitar,
  ariaLabel,
}: {
  etiqueta: string
  onQuitar: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onQuitar}
      aria-label={ariaLabel ?? `Cambiar ${etiqueta}`}
      className={CLASE_MIGA}
    >
      <span>{etiqueta}</span>
      <span aria-hidden="true">×</span>
    </button>
  )
}
