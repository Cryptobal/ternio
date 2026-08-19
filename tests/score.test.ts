import { describe, expect, it } from 'vitest'

import {
  SCORE_MAXIMO,
  SCORE_MAXIMO_HOGAR,
  calcularScore,
  esCorreoCorporativo,
  scoreMaximoPorAudiencia,
} from '@/lib/score'

const BASE = {
  rutValido: true,
  telefonoVerificado: false,
  email: 'contacto@empresa.cl',
  esMovil: true,
  razonSocialDeclarada: true,
  largoDetalle: 80,
  plazo: 'urgente',
}

describe('esCorreoCorporativo', () => {
  it('reconoce dominios propios', () => {
    expect(esCorreoCorporativo('maria@constructora.cl')).toBe(true)
  })

  it('marca como genéricos los correos de siempre', () => {
    expect(esCorreoCorporativo('maria@gmail.com')).toBe(false)
    expect(esCorreoCorporativo('maria@HOTMAIL.com')).toBe(false)
  })

  it('no se cae con un correo mal escrito', () => {
    expect(esCorreoCorporativo('sin-arroba')).toBe(false)
  })
})

describe('calcularScore', () => {
  it('un correo Gmail baja el puntaje pero no descarta el lead', () => {
    const corporativo = calcularScore(BASE)
    const generico = calcularScore({ ...BASE, email: 'maria@gmail.com' })

    expect(generico).toBeLessThan(corporativo)
    expect(generico).toBeGreaterThan(0)
  })

  it('el teléfono verificado es la señal que más suma después del RUT', () => {
    const sinVerificar = calcularScore(BASE)
    const verificado = calcularScore({ ...BASE, telefonoVerificado: true })
    expect(verificado).toBeGreaterThan(sinVerificar)
  })

  it('nunca se pasa de 100 ni baja de 0', () => {
    const maximo = calcularScore({ ...BASE, telefonoVerificado: true })
    expect(maximo).toBeLessThanOrEqual(SCORE_MAXIMO)

    const minimo = calcularScore({
      rutValido: false,
      telefonoVerificado: false,
      email: 'maria@gmail.com',
      esMovil: false,
      razonSocialDeclarada: false,
      largoDetalle: 0,
      plazo: undefined,
    })
    expect(minimo).toBe(0)
  })

  it('el tope hogar es 90 (sin bonus de razón social)', () => {
    expect(scoreMaximoPorAudiencia('hogar')).toBe(SCORE_MAXIMO_HOGAR)
    expect(scoreMaximoPorAudiencia('empresa')).toBe(SCORE_MAXIMO)
    expect(scoreMaximoPorAudiencia(null)).toBe(SCORE_MAXIMO)

    const hogar = calcularScore({ ...BASE, razonSocialDeclarada: false, telefonoVerificado: true })
    expect(hogar).toBeLessThanOrEqual(SCORE_MAXIMO_HOGAR)
  })

  it('es determinista', () => {
    expect(calcularScore(BASE)).toBe(calcularScore(BASE))
  })
})
