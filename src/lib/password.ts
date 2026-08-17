import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Hash de contraseña para la cuenta de admin (provider Credentials).
 * Usa scrypt de node:crypto para no sumar una dependencia por un solo usuario.
 *
 * Formato almacenado: "scrypt$N$r$p$<salt base64>$<hash base64>".
 * El hash vive en la env ADMIN_PASSWORD_HASH y en Usuario.passwordHash;
 * la contraseña en claro nunca toca el repositorio ni la base.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  opciones: { N: number; r: number; p: number },
) => Promise<Buffer>

const N = 16384
const R = 8
const P = 1
const LARGO_CLAVE = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password.normalize('NFKC'), salt, LARGO_CLAVE, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verificarPassword(
  password: string,
  almacenado: string | null | undefined,
): Promise<boolean> {
  if (!almacenado) return false

  const partes = almacenado.split('$')
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false

  const [, nStr, rStr, pStr, saltB64, hashB64] = partes as [
    string, string, string, string, string, string,
  ]

  const n = Number(nStr)
  const r = Number(rStr)
  const p = Number(pStr)
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p)) {
    return false
  }

  const salt = Buffer.from(saltB64, 'base64')
  const esperado = Buffer.from(hashB64, 'base64')
  if (esperado.length === 0) return false

  const calculado = await scryptAsync(password.normalize('NFKC'), salt, esperado.length, {
    N: n,
    r,
    p,
  })

  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
}
