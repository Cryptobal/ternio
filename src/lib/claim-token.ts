import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Token de reclamo de leads.
 *
 * El comprador cotiza sin cuenta. Al crear el lead se deja una cookie httpOnly
 * firmada con este token; cuando después confirma el teléfono por OTP, la server
 * action de reclamo usa el token para asignarle los leads creados en ese
 * navegador. La cookie sola no revela nada: en la base solo se guarda el hash.
 *
 * Formato: "<nonce hex>.<expiración epoch s>.<HMAC-SHA256 base64url>".
 */

export const VIGENCIA_CLAIM_TOKEN_SEGUNDOS = 60 * 60 * 24 // 24 h
export const NOMBRE_COOKIE_CLAIM = 'ternio_lead_claim'

function secreto(): string {
  const valor = process.env.AUTH_SECRET
  if (!valor) {
    throw new Error(
      'Falta AUTH_SECRET: no se puede firmar el token de reclamo de leads.',
    )
  }
  return valor
}

function firmar(payload: string): string {
  return createHmac('sha256', secreto()).update(payload).digest('base64url')
}

/** Hash que se guarda en Lead.claimTokenHash (nunca el token en claro). */
export function hashClaimToken(token: string): string {
  const nonce = token.split('.')[0] ?? ''
  return createHash('sha256').update(nonce).digest('hex')
}

export type ClaimTokenEmitido = {
  token: string
  hash: string
  expiraAt: Date
}

export function emitirClaimToken(ahora: Date = new Date()): ClaimTokenEmitido {
  const nonce = randomBytes(32).toString('hex')
  const expiraEpoch = Math.floor(ahora.getTime() / 1000) + VIGENCIA_CLAIM_TOKEN_SEGUNDOS
  const payload = `${nonce}.${expiraEpoch}`
  const token = `${payload}.${firmar(payload)}`

  return {
    token,
    hash: hashClaimToken(token),
    expiraAt: new Date(expiraEpoch * 1000),
  }
}

/**
 * Verifica firma y vigencia. Devuelve el hash a consultar, o null si el token
 * es inválido, fue manipulado o venció (en cuyo caso el lead simplemente
 * queda para gestión del admin).
 */
export function verificarClaimToken(
  token: string | null | undefined,
  ahora: Date = new Date(),
): string | null {
  if (!token) return null

  const partes = token.split('.')
  if (partes.length !== 3) return null

  const [nonce, expiraStr, firma] = partes as [string, string, string]
  if (!/^[0-9a-f]{64}$/.test(nonce)) return null

  const expiraEpoch = Number(expiraStr)
  if (!Number.isSafeInteger(expiraEpoch)) return null
  if (expiraEpoch * 1000 <= ahora.getTime()) return null

  const esperada = Buffer.from(firmar(`${nonce}.${expiraStr}`))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length) return null
  if (!timingSafeEqual(esperada, recibida)) return null

  return hashClaimToken(token)
}
