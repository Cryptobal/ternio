/** Clases compartidas del refresco visual. Una superficie, no una pila de inputs. */

export const CLASE_SUPERFICIE =
  'rounded-3xl border border-(--color-borde) bg-white p-5 shadow-[0_1px_2px_rgb(14_27_44/0.05),0_18px_40px_-22px_rgb(14_27_44/0.22)] sm:p-6'

export const CLASE_CAMPO =
  'w-full min-h-12 rounded-2xl border border-(--color-borde) bg-(--color-papel) px-3.5 py-2.5 text-base outline-none transition ' +
  'focus:border-(--color-marca) focus:bg-white focus:shadow-[0_0_0_4px_rgb(255_171_26/0.28)]'

export const CLASE_CHIP =
  'min-h-12 rounded-2xl border border-(--color-borde) bg-white px-4 py-3 text-left text-base transition hover:border-(--color-marca)'

export const CLASE_CHIP_ACTIVO =
  'border-(--color-marca) bg-(--color-ambar-suave) shadow-[0_0_0_3px_rgb(255_171_26/0.28)]'

export const CLASE_BOTON =
  'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-(--color-marca) px-5 py-3 text-base font-semibold text-white transition hover:bg-(--color-tinta) disabled:opacity-60'

export const CLASE_PASO_ACTIVO = 'ring-2 ring-(--color-ambar) ring-offset-2'

export const CLASE_MIGA =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-(--color-borde) bg-(--color-papel) px-3 py-1.5 text-sm font-medium transition hover:border-(--color-marca)'
