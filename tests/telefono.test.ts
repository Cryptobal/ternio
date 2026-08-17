import { describe, expect, it } from 'vitest'

import { esMovil, formatearTelefono, normalizarTelefonoE164 } from '@/lib/telefono'

describe('normalizarTelefonoE164', () => {
  it('colapsa todas las formas de escribir un móvil en el mismo E.164', () => {
    const esperado = '+56912345678'
    expect(normalizarTelefonoE164('+56912345678')).toBe(esperado)
    expect(normalizarTelefonoE164('+56 9 1234 5678')).toBe(esperado)
    expect(normalizarTelefonoE164('56912345678')).toBe(esperado)
    expect(normalizarTelefonoE164('912345678')).toBe(esperado)
    expect(normalizarTelefonoE164('09 1234 5678')).toBe(esperado)
    expect(normalizarTelefonoE164('(9) 1234-5678')).toBe(esperado)
  })

  it('normaliza fijos con código de área', () => {
    expect(normalizarTelefonoE164('223456789')).toBe('+56223456789')
    expect(normalizarTelefonoE164('+56 22 345 6789')).toBe('+56223456789')
  })

  it('completa el código de área de Santiago en fijos de 8 dígitos', () => {
    expect(normalizarTelefonoE164('23456789')).toBe('+56223456789')
  })

  it('rechaza lo que no es un teléfono chileno', () => {
    expect(normalizarTelefonoE164('')).toBeNull()
    expect(normalizarTelefonoE164(null)).toBeNull()
    expect(normalizarTelefonoE164('1234')).toBeNull()
    expect(normalizarTelefonoE164('+1 415 555 0123')).toBeNull()
    expect(normalizarTelefonoE164('sin números')).toBeNull()
  })
})

describe('esMovil', () => {
  it('distingue móviles de fijos', () => {
    expect(esMovil('+56912345678')).toBe(true)
    expect(esMovil('+56223456789')).toBe(false)
  })
})

describe('formatearTelefono', () => {
  it('muestra el móvil separado', () => {
    expect(formatearTelefono('+56912345678')).toBe('+56 9 1234 5678')
  })
})
