import { beforeAll, describe, expect, it } from 'vitest'

import {
  VIGENCIA_CLAIM_TOKEN_SEGUNDOS,
  emitirClaimToken,
  hashClaimToken,
  verificarClaimToken,
} from '@/lib/claim-token'

beforeAll(() => {
  process.env.AUTH_SECRET = 'secreto-de-pruebas-solamente'
})

describe('emitirClaimToken', () => {
  it('emite un token con su hash y su vencimiento a 24 horas', () => {
    const ahora = new Date('2026-08-17T12:00:00Z')
    const emitido = emitirClaimToken(ahora)

    expect(emitido.token.split('.')).toHaveLength(3)
    expect(emitido.hash).toBe(hashClaimToken(emitido.token))
    expect(emitido.expiraAt.getTime()).toBe(
      ahora.getTime() + VIGENCIA_CLAIM_TOKEN_SEGUNDOS * 1000,
    )
  })

  it('nunca repite un token', () => {
    const uno = emitirClaimToken()
    const otro = emitirClaimToken()
    expect(uno.token).not.toBe(otro.token)
    expect(uno.hash).not.toBe(otro.hash)
  })

  it('el hash guardado no revela el token', () => {
    const emitido = emitirClaimToken()
    expect(emitido.hash).not.toContain(emitido.token.split('.')[0])
    expect(emitido.hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('verificarClaimToken', () => {
  it('acepta un token propio y vigente, y devuelve el hash a consultar', () => {
    const emitido = emitirClaimToken()
    expect(verificarClaimToken(emitido.token)).toBe(emitido.hash)
  })

  it('rechaza una cookie ausente o con basura', () => {
    expect(verificarClaimToken(null)).toBeNull()
    expect(verificarClaimToken(undefined)).toBeNull()
    expect(verificarClaimToken('')).toBeNull()
    expect(verificarClaimToken('cualquier-cosa')).toBeNull()
    expect(verificarClaimToken('a.b.c')).toBeNull()
  })

  it('rechaza un token con la firma manipulada', () => {
    const emitido = emitirClaimToken()
    const [nonce, expira] = emitido.token.split('.')
    expect(verificarClaimToken(`${nonce}.${expira}.firmaInventada`)).toBeNull()
  })

  it('rechaza un token al que le estiraron el vencimiento', () => {
    const emitido = emitirClaimToken()
    const [nonce, , firma] = emitido.token.split('.')
    const masTarde = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
    expect(verificarClaimToken(`${nonce}.${masTarde}.${firma}`)).toBeNull()
  })

  it('rechaza un token vencido: el lead queda para gestión del admin', () => {
    const emision = new Date('2026-08-17T12:00:00Z')
    const emitido = emitirClaimToken(emision)

    const dentroDePlazo = new Date(emision.getTime() + 23 * 60 * 60 * 1000)
    expect(verificarClaimToken(emitido.token, dentroDePlazo)).toBe(emitido.hash)

    const fueraDePlazo = new Date(emision.getTime() + 25 * 60 * 60 * 1000)
    expect(verificarClaimToken(emitido.token, fueraDePlazo)).toBeNull()
  })

  it('rechaza un token firmado con otro secreto (cookie de otro despliegue)', () => {
    const emitido = emitirClaimToken()
    const secretoOriginal = process.env.AUTH_SECRET

    process.env.AUTH_SECRET = 'otro-secreto-distinto'
    expect(verificarClaimToken(emitido.token)).toBeNull()

    process.env.AUTH_SECRET = secretoOriginal
    expect(verificarClaimToken(emitido.token)).toBe(emitido.hash)
  })

  it('es idempotente: verificar dos veces da el mismo hash', () => {
    const emitido = emitirClaimToken()
    expect(verificarClaimToken(emitido.token)).toBe(verificarClaimToken(emitido.token))
  })
})
