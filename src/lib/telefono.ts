/**
 * Teléfonos chilenos en formato E.164 (+56XXXXXXXXX).
 *
 * Normalizar antes de persistir es lo que permite deduplicar leads y anclar
 * el OTP a la cuenta: el mismo número escrito de cinco maneras distintas
 * tiene que colapsar en una sola clave.
 *
 * Acepta: "+56 9 1234 5678", "56912345678", "912345678", "09 1234 5678",
 * y fijos de Santiago de 8 dígitos ("22345678" → "+56222345678" no aplica:
 * el fijo ya viene con el 2 de área, ver abajo).
 */

export type TelefonoE164 = string

export function normalizarTelefonoE164(
  telefono: string | null | undefined,
): TelefonoE164 | null {
  if (!telefono) return null

  let digitos = telefono.replace(/[^\d]/g, '')
  if (!digitos) return null

  // Prefijo internacional de Chile, con o sin "+".
  if (digitos.startsWith('56') && digitos.length > 9) {
    digitos = digitos.slice(2)
  }

  // Prefijo nacional antiguo.
  digitos = digitos.replace(/^0+/, '')

  // Móviles (9XXXXXXXX) y fijos con código de área (2XXXXXXXX, 32XXXXXXX…):
  // 9 dígitos en total.
  if (digitos.length === 9) {
    return `+56${digitos}`
  }

  // Fijo de Santiago escrito sin el 2 de área (8 dígitos).
  if (digitos.length === 8) {
    return `+562${digitos}`
  }

  return null
}

export function esTelefonoChilenoValido(telefono: string | null | undefined): boolean {
  return normalizarTelefonoE164(telefono) !== null
}

/** true si el número normalizado es un móvil (único que puede recibir OTP por SMS). */
export function esMovil(telefonoE164: TelefonoE164): boolean {
  return /^\+569\d{8}$/.test(telefonoE164)
}

/** Presentación amable: "+56 9 1234 5678". */
export function formatearTelefono(telefonoE164: TelefonoE164): string {
  const m = /^\+56(9)(\d{4})(\d{4})$/.exec(telefonoE164)
  if (m) return `+56 ${m[1]} ${m[2]} ${m[3]}`
  return telefonoE164
}
