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

/** Cotizador sobre navy: sin losa blanca. Naranja solo en el CTA final. */
export const CLASE_CAMPO_NAVY =
  'w-full min-h-12 rounded-2xl border border-white/25 bg-[#0a1522] px-3.5 py-2.5 text-base text-white placeholder:text-white/45 outline-none transition ' +
  'focus:border-white/55 focus:shadow-[0_0_0_4px_rgb(255_255_255/0.08)]'

export const CLASE_CHIP_NAVY =
  'min-h-12 rounded-2xl border border-white/25 bg-transparent px-4 py-3 text-left text-base text-white transition hover:border-white/55 hover:bg-white/5'

export const CLASE_CHIP_NAVY_ACTIVO = 'border-white/70 bg-white/10'

export const CLASE_MIGA_NAVY =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-transparent px-3 py-1.5 text-sm font-medium text-white transition hover:border-white/70'

export const CLASE_BOTON_AMBAR =
  'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-(--color-ambar) px-5 py-3 text-base font-semibold text-(--color-tinta) transition hover:brightness-110 disabled:opacity-60'

export const CLASE_LEYENDA_NAVY = 'mb-2 text-sm font-medium text-white/80'
