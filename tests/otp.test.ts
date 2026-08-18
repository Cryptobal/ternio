import { afterEach, describe, expect, it } from 'vitest'

import {
  codigoOtpCoincide,
  evaluarIntentoOtp,
  hashCodigoOtp,
  hashTokenSesionOtp,
} from '@/lib/otp'
import { consumirRateLimit, reiniciarRateLimit } from '@/lib/rate-limit'

const CLAVE = 'secreto-de-pruebas-otp'

describe('OTP', () => {
  afterEach(() => {
    reiniciarRateLimit()
  })

  it('un código válido coincide con su hash; uno inválido no', () => {
    const hash = hashCodigoOtp('123456', CLAVE)
    expect(codigoOtpCoincide('123456', hash, CLAVE)).toBe(true)
    expect(codigoOtpCoincide('000000', hash, CLAVE)).toBe(false)
  })

  it('un código expirado, consumido o con intentos agotados no pasa', () => {
    const hash = hashCodigoOtp('654321', CLAVE)
    const base = {
      codigo: '654321',
      hash,
      clave: CLAVE,
      ahora: new Date('2026-08-18T12:00:00Z'),
    }

    expect(
      evaluarIntentoOtp({
        ...base,
        expiraAt: new Date('2026-08-18T11:50:00Z'),
        consumidoAt: null,
        intentos: 0,
      }),
    ).toEqual({ ok: false, motivo: 'expirado' })

    expect(
      evaluarIntentoOtp({
        ...base,
        expiraAt: new Date('2026-08-18T12:10:00Z'),
        consumidoAt: new Date('2026-08-18T11:55:00Z'),
        intentos: 0,
      }),
    ).toEqual({ ok: false, motivo: 'consumido' })

    expect(
      evaluarIntentoOtp({
        ...base,
        expiraAt: new Date('2026-08-18T12:10:00Z'),
        consumidoAt: null,
        intentos: 5,
      }),
    ).toEqual({ ok: false, motivo: 'intentos' })

    expect(
      evaluarIntentoOtp({
        ...base,
        codigo: '000000',
        expiraAt: new Date('2026-08-18T12:10:00Z'),
        consumidoAt: null,
        intentos: 1,
      }),
    ).toEqual({ ok: false, motivo: 'invalido' })
  })

  it('un código vigente y no consumido sí pasa', () => {
    const hash = hashCodigoOtp('111222', CLAVE)
    expect(
      evaluarIntentoOtp({
        codigo: '111222',
        hash,
        clave: CLAVE,
        expiraAt: new Date('2026-08-18T12:10:00Z'),
        consumidoAt: null,
        intentos: 2,
        ahora: new Date('2026-08-18T12:00:00Z'),
      }),
    ).toEqual({ ok: true })
  })

  it('el token de sesión no es el código crudo', () => {
    const hashCodigo = hashCodigoOtp('123456', CLAVE)
    const hashSesion = hashTokenSesionOtp('token-interno', CLAVE)
    expect(hashSesion).not.toBe(hashCodigo)
    expect(hashSesion).not.toBe('123456')
  })

  it('el rate limit corta reintentos por teléfono', () => {
    expect(consumirRateLimit('otp-hora:+56911111111', 4, 60_000).permitido).toBe(true)
    expect(consumirRateLimit('otp-hora:+56911111111', 4, 60_000).permitido).toBe(true)
    expect(consumirRateLimit('otp-hora:+56911111111', 4, 60_000).permitido).toBe(true)
    expect(consumirRateLimit('otp-hora:+56911111111', 4, 60_000).permitido).toBe(true)
    expect(consumirRateLimit('otp-hora:+56911111111', 4, 60_000).permitido).toBe(false)
  })
})
