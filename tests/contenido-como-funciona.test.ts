import { describe, expect, it } from 'vitest'

import { LADO_COMPRADOR, LADO_PROVEEDOR, LADOS_COMO_FUNCIONA } from '@/lib/contenido-como-funciona'

describe('contenido-como-funciona', () => {
  it('cada lado tiene exactamente cuatro pasos no vacíos', () => {
    expect(LADOS_COMO_FUNCIONA).toHaveLength(2)
    for (const lado of [LADO_COMPRADOR, LADO_PROVEEDOR]) {
      expect(lado.pasos).toHaveLength(4)
      for (const paso of lado.pasos) {
        expect(paso.titulo.trim().length).toBeGreaterThan(0)
        expect(paso.texto.trim().length).toBeGreaterThan(0)
      }
      expect(lado.cierre.trim().length).toBeGreaterThan(0)
    }
  })

  it('el comprador no paga nunca', () => {
    expect(LADO_COMPRADOR.cierre.toLowerCase()).toContain('no pagas')
  })
})
