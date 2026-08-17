import { beforeEach, describe, expect, it } from 'vitest'

import { consumirRateLimit, reiniciarRateLimit } from '@/lib/rate-limit'

beforeEach(() => {
  reiniciarRateLimit()
})

describe('consumirRateLimit', () => {
  it('deja pasar hasta el límite y después frena', () => {
    for (let intento = 1; intento <= 3; intento += 1) {
      expect(consumirRateLimit('clave', 3, 60_000, 1_000).permitido).toBe(true)
    }
    expect(consumirRateLimit('clave', 3, 60_000, 1_000).permitido).toBe(false)
  })

  it('cuenta cada clave por separado', () => {
    consumirRateLimit('ip-a', 1, 60_000, 1_000)
    expect(consumirRateLimit('ip-a', 1, 60_000, 1_000).permitido).toBe(false)
    expect(consumirRateLimit('ip-b', 1, 60_000, 1_000).permitido).toBe(true)
  })

  it('vuelve a permitir cuando pasa la ventana', () => {
    consumirRateLimit('clave', 1, 60_000, 1_000)
    expect(consumirRateLimit('clave', 1, 60_000, 30_000).permitido).toBe(false)
    expect(consumirRateLimit('clave', 1, 60_000, 62_000).permitido).toBe(true)
  })

  it('dice cuántos segundos faltan para reintentar', () => {
    consumirRateLimit('clave', 1, 60_000, 1_000)
    const frenado = consumirRateLimit('clave', 1, 60_000, 31_000)
    expect(frenado.permitido).toBe(false)
    expect(frenado.reintentarEnSegundos).toBe(30)
  })
})
