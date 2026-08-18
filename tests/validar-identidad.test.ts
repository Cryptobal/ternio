import { describe, expect, it } from 'vitest'

import { errorCampoIdentidad, validarIdentidadTronco } from '@/lib/validar-identidad'

describe('validarIdentidadTronco', () => {
  const valido = {
    razonSocial: 'Ejemplo SpA',
    rut: '12.345.678-5',
    nombreContacto: 'Ana Pérez',
    telefono: '+56 9 1234 5678',
    email: 'ana@gmail.com',
  }

  it('acepta el tronco completo, incluido Gmail', () => {
    const resultado = validarIdentidadTronco(valido)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.datos.rutNormalizado).toBe('12345678-5')
      expect(resultado.datos.telefonoE164).toBe('+56912345678')
      expect(resultado.datos.email).toBe('ana@gmail.com')
    }
  })

  it('falla cerrado si falta razón social, nombre o el DV del RUT', () => {
    expect(validarIdentidadTronco({ ...valido, razonSocial: '' }).ok).toBe(false)
    expect(validarIdentidadTronco({ ...valido, nombreContacto: '' }).ok).toBe(false)
    const rutMalo = validarIdentidadTronco({ ...valido, rut: '12.345.678-4' })
    expect(rutMalo.ok).toBe(false)
    if (!rutMalo.ok) expect(rutMalo.errores.rut).toMatch(/dígito verificador/)
  })

  it('exige celular chileno, no un fijo', () => {
    const fijo = validarIdentidadTronco({ ...valido, telefono: '223456789' })
    expect(fijo.ok).toBe(false)
    if (!fijo.ok) expect(fijo.errores.telefono).toMatch(/celular/)
  })

  it('no rechaza el correo por ser Gmail; sí rechaza formato inválido', () => {
    expect(errorCampoIdentidad('email', 'ana@gmail.com')).toBeUndefined()
    expect(errorCampoIdentidad('email', 'sin-arroba')).toMatch(/correo/)
  })
})
