/**
 * RUT chileno: normalización y validación de dígito verificador.
 *
 * Formato normalizado que se persiste: cuerpo sin puntos + guion + DV en
 * mayúscula. Ej: "12.345.678-5" → "12345678-5"; "7.654.321-k" → "7654321-K".
 * Guardar siempre el normalizado es lo que hace confiable la deduplicación.
 */

export type RutNormalizado = string

/** Deja solo dígitos y la K final, en mayúscula. */
function limpiar(rut: string): string {
  return rut.trim().toUpperCase().replace(/[^0-9K]/g, '')
}

/**
 * Calcula el dígito verificador de un cuerpo de RUT (módulo 11).
 * Devuelve "0"–"9" o "K".
 */
export function calcularDv(cuerpo: string): string {
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

/**
 * Normaliza un RUT si es válido. Devuelve null cuando el formato no calza o
 * el dígito verificador no corresponde: sin RUT válido no hay venta posible.
 */
export function normalizarRut(rut: string | null | undefined): RutNormalizado | null {
  if (!rut) return null

  const limpio = limpiar(rut)
  // Cuerpo de 7 u 8 dígitos + DV. Descarta "K" en el cuerpo.
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return null

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  if (calcularDv(cuerpo) !== dv) return null

  return `${cuerpo}-${dv}`
}

/**
 * Formas que pudieron quedar persistidas para el mismo RUT: canónica
 * (`cuerpo-DV`) y compacta (sin guion). El alta tiene que tratar ambas
 * como la misma empresa; si no, un `778406233` no reclama a `77840623-3`.
 */
export function variantesRutPersistido(rut: string | null | undefined): string[] {
  const canon = normalizarRut(rut)
  if (!canon) return []
  const compacto = canon.replace('-', '')
  return compacto === canon ? [canon] : [canon, compacto]
}

/** true solo si el RUT es válido (formato + dígito verificador). */
export function esRutValido(rut: string | null | undefined): boolean {
  return normalizarRut(rut) !== null
}

/** Presentación con puntos, para mostrar al admin o al proveedor que compró. */
export function formatearRut(rutNormalizado: RutNormalizado): string {
  const canon = normalizarRut(rutNormalizado) ?? rutNormalizado
  const [cuerpo, dv] = canon.split('-')
  if (!cuerpo || !dv) return canon
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}
