import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

export const OTP_LARGO = 6
export const OTP_EXPIRA_MS = 10 * 60_000
export const OTP_MAX_INTENTOS = 5
export const OTP_REENVIO_MS = 60_000
export const OTP_TOPE_POR_HORA = 4
export const OTP_SESION_EXPIRA_MS = 2 * 60_000

export function generarCodigoOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LARGO, '0')
}

function secreto(): string {
  const valor = process.env.AUTH_SECRET
  if (!valor) {
    throw new Error('Falta AUTH_SECRET: no se puede firmar un código OTP.')
  }
  return valor
}

export function hashCodigoOtp(codigo: string, clave: string = secreto()): string {
  return createHmac('sha256', clave).update(`otp:${codigo}`).digest('hex')
}

export function codigoOtpCoincide(
  codigo: string,
  hash: string,
  clave: string = secreto(),
): boolean {
  const calculado = Buffer.from(hashCodigoOtp(codigo, clave))
  const esperado = Buffer.from(hash)
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
}

export type EvaluacionOtp =
  | { ok: true }
  | { ok: false; motivo: 'expirado' | 'consumido' | 'intentos' | 'invalido' }

export function evaluarIntentoOtp(args: {
  codigo: string
  hash: string
  expiraAt: Date
  consumidoAt: Date | null
  intentos: number
  ahora?: Date
  clave?: string
}): EvaluacionOtp {
  const ahora = args.ahora ?? new Date()
  if (args.consumidoAt) return { ok: false, motivo: 'consumido' }
  if (args.expiraAt.getTime() <= ahora.getTime()) return { ok: false, motivo: 'expirado' }
  if (args.intentos >= OTP_MAX_INTENTOS) return { ok: false, motivo: 'intentos' }
  if (!/^\d{6}$/.test(args.codigo) || !codigoOtpCoincide(args.codigo, args.hash, args.clave)) {
    return { ok: false, motivo: 'invalido' }
  }
  return { ok: true }
}

export function hashTokenSesionOtp(token: string, clave: string = secreto()): string {
  return createHmac('sha256', clave).update(`otp-sesion:${token}`).digest('hex')
}

export function emitirTokenSesionOtp(clave: string = secreto()): { token: string; hash: string } {
  const token = `${Date.now().toString(36)}.${randomInt(1e9, 2e9).toString(36)}.${randomInt(1e9, 2e9).toString(36)}`
  return { token, hash: hashTokenSesionOtp(token, clave) }
}

export function enmascararTelefono(telefonoE164: string): string {
  const m = /^\+56(9)(\d{4})(\d{4})$/.exec(telefonoE164)
  if (!m) return 'tu teléfono'
  return `+56 ${m[1]} **** ${m[3]}`
}
