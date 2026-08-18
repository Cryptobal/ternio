import { describe, expect, it } from 'vitest'

import {
  calcularDv,
  esRutValido,
  formatearRut,
  normalizarRut,
  variantesRutPersistido,
} from '@/lib/rut'

describe('calcularDv', () => {
  it('calcula el dígito verificador con módulo 11', () => {
    expect(calcularDv('12345678')).toBe('5')
    expect(calcularDv('7654321')).toBe('6')
  })

  it('devuelve K cuando el resto es 10', () => {
    expect(calcularDv('10000013')).toBe('K')
    expect(calcularDv('10000027')).toBe('K')
  })

  it('devuelve 0 cuando el resto es 11', () => {
    expect(calcularDv('10000004')).toBe('0')
    expect(calcularDv('10000018')).toBe('0')
  })
})

describe('normalizarRut', () => {
  it('normaliza distintos formatos al mismo valor', () => {
    const esperado = '12345678-5'
    expect(normalizarRut('12345678-5')).toBe(esperado)
    expect(normalizarRut('12.345.678-5')).toBe(esperado)
    expect(normalizarRut(' 12345678 5 ')).toBe(esperado)
    expect(normalizarRut('123456785')).toBe(esperado)
    expect(normalizarRut('778406233')).toBe('77840623-3')
    expect(normalizarRut('77.840.623-3')).toBe('77840623-3')
  })

  it('el compacto sin guion y el canónico son el mismo RUT', () => {
    expect(variantesRutPersistido('778406233')).toEqual(['77840623-3', '778406233'])
    expect(variantesRutPersistido('77840623-3')).toEqual(['77840623-3', '778406233'])
    expect(variantesRutPersistido('77.840.623-3')).toEqual(['77840623-3', '778406233'])
    expect(variantesRutPersistido('10000013-K')).toEqual(['10000013-K', '10000013K'])
    expect(variantesRutPersistido('12.345.678-4')).toEqual([])
  })

  it('acepta K en mayúscula y minúscula', () => {
    expect(normalizarRut('10000013-k')).toBe('10000013-K')
    expect(normalizarRut('10.000.013-K')).toBe('10000013-K')
  })

  it('rechaza un dígito verificador que no cuadra', () => {
    expect(normalizarRut('12345678-9')).toBeNull()
    expect(normalizarRut('10000013-1')).toBeNull()
  })

  it('rechaza formatos imposibles', () => {
    expect(normalizarRut('')).toBeNull()
    expect(normalizarRut(null)).toBeNull()
    expect(normalizarRut(undefined)).toBeNull()
    expect(normalizarRut('no-es-un-rut')).toBeNull()
    // Cuerpo demasiado corto y demasiado largo.
    expect(normalizarRut('1234-3')).toBeNull()
    expect(normalizarRut('1234567890-1')).toBeNull()
    // La K solo puede ir en el dígito verificador.
    expect(normalizarRut('1234K678-5')).toBeNull()
  })
})

describe('esRutValido', () => {
  it('solo aprueba RUT con dígito verificador correcto', () => {
    expect(esRutValido('12.345.678-5')).toBe(true)
    expect(esRutValido('12.345.678-4')).toBe(false)
  })
})

describe('formatearRut', () => {
  it('devuelve el RUT con puntos para mostrarlo', () => {
    expect(formatearRut('12345678-5')).toBe('12.345.678-5')
    expect(formatearRut('7654321-6')).toBe('7.654.321-6')
    expect(formatearRut('778406233')).toBe('77.840.623-3')
  })
})
