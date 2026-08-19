/** Clases compartidas del refresco visual. Una superficie, no una pila de inputs. */

export const CLASE_SUPERFICIE =
  'rounded-3xl border border-(--color-borde) bg-(--color-superficie) p-5 shadow-[0_1px_2px_rgb(14_27_44/0.05),0_18px_40px_-22px_rgb(14_27_44/0.22)] sm:p-6'

export const CLASE_CAMPO =
  'w-full min-h-12 rounded-2xl border border-(--color-borde) bg-(--color-superficie-2) px-3.5 py-2.5 text-base text-(--color-texto) outline-none transition ' +
  'focus:border-(--color-boton) focus:bg-(--color-superficie) focus:shadow-[0_0_0_4px_rgb(255_171_26/0.28)]'

export const CLASE_CHIP =
  'min-h-12 rounded-2xl border border-(--color-borde) bg-(--color-superficie) px-4 py-3 text-left text-base text-(--color-texto) transition hover:border-(--color-boton)'

export const CLASE_CHIP_ACTIVO =
  'border-(--color-boton) bg-(--color-ambar-suave) text-(--color-tinta) shadow-[0_0_0_3px_rgb(255_171_26/0.28)]'

export const CLASE_BOTON =
  'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-(--color-boton) px-5 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60'

export const CLASE_BOTON_SUAVE =
  'inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-(--color-borde) bg-(--color-superficie) px-5 py-3 text-base font-semibold text-(--color-texto) transition hover:border-(--color-boton) disabled:opacity-60'

export const CLASE_PASO_ACTIVO = 'ring-2 ring-(--color-ambar) ring-offset-2'

export const CLASE_MIGA =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-(--color-borde) bg-(--color-superficie-2) px-3 py-1.5 text-sm font-medium text-(--color-texto) transition hover:border-(--color-boton)'

/** Cotizador sobre navy: sin losa blanca. Naranja solo en el CTA final. */
export const CLASE_CAMPO_NAVY =
  'w-full min-h-12 rounded-2xl border border-white/25 bg-[#0a1522] px-3.5 py-2.5 text-base text-white placeholder:text-white/45 outline-none transition ' +
  'focus:border-white/55 focus:shadow-[0_0_0_4px_rgb(255_255_255/0.08)]'

export const CLASE_CHIP_NAVY =
  'min-h-12 rounded-2xl border border-white/25 bg-transparent px-4 py-3 text-left text-base text-white transition hover:border-white/55 hover:bg-white/5'

export const CLASE_CHIP_NAVY_ACTIVO = 'border-white/70 bg-white/10'

/**
 * Tarjetas del paso audiencia (casa/empresa): alto fijo, icono + una palabra.
 * Hover/focus con borde ámbar y fondo ámbar al 13 %.
 */
export const CLASE_TARJETA_AUDIENCIA =
  'flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/40 bg-white/10 px-4 py-3 text-center text-white transition ' +
  'hover:border-(--color-ambar) hover:bg-[rgb(255_171_26/0.13)] ' +
  'focus-visible:outline-none focus-visible:border-(--color-ambar) focus-visible:bg-[rgb(255_171_26/0.13)] focus-visible:ring-2 focus-visible:ring-(--color-ambar) focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-hero)]'

export const CLASE_TARJETA_AUDIENCIA_ACTIVA =
  'border-(--color-ambar) bg-[rgb(255_171_26/0.13)]'

/** @deprecated Preferir CLASE_TARJETA_AUDIENCIA. */
export const CLASE_TARJETA_NAVY = CLASE_TARJETA_AUDIENCIA

/** @deprecated Preferir CLASE_TARJETA_AUDIENCIA_ACTIVA. */
export const CLASE_TARJETA_NAVY_ACTIVA = CLASE_TARJETA_AUDIENCIA_ACTIVA

export const CLASE_MIGA_NAVY =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-transparent px-3 py-1.5 text-sm font-medium text-white transition hover:border-white/70'

export const CLASE_BOTON_AMBAR =
  'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-(--color-ambar) px-5 py-3 text-base font-semibold text-(--color-tinta) transition hover:brightness-110 disabled:opacity-60'

export const CLASE_LEYENDA_NAVY = 'mb-2 text-sm font-medium text-white/80'

/** Pregunta del paso 1 del cotizador: más peso que la leyenda de los otros pasos. */
export const CLASE_PREGUNTA_NAVY = 'mb-3 text-base font-medium text-white'

/** Riel de progreso del cotizador (tres tramos = tres respuestas). */
export const CLASE_RIEL_PROGRESO =
  'grid grid-cols-3 gap-1.5'

export const CLASE_RIEL_TRAMO =
  'h-1 rounded-full bg-white/20 transition-[background-color] duration-200'

export const CLASE_RIEL_TRAMO_ACTIVO = 'bg-(--color-ambar)'
