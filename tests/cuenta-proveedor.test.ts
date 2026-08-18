import { describe, expect, it } from 'vitest'

import { validarCuentaProveedor } from '@/lib/cuenta-proveedor'

describe('validarCuentaProveedor', () => {
  const valido = {
    nombreEmpresa: 'Guardias del Sur SpA',
    rut: '12.345.678-5',
    telefono: '+56 9 8123 4567',
    email: 'hola@guardias.cl',
    rubros: ['seguridad'],
    modoCobertura: 'nacional',
  }

  it('acepta una cuenta con cobertura nacional', () => {
    const resultado = validarCuentaProveedor(valido)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.datos.cobertura.modo).toBe('nacional')
  })

  it('exige RUT con DV, rubro y cobertura', () => {
    expect(validarCuentaProveedor({ ...valido, rut: '76.482.113-4' }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, rubros: [] }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, nombreEmpresa: '' }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, modoCobertura: 'comuna', comunas: [] }).ok).toBe(false)
  })

  it('acepta cobertura por región y por comuna', () => {
    const region = validarCuentaProveedor({
      ...valido,
      modoCobertura: 'region',
      regiones: ['Región de Los Ríos'],
    })
    expect(region.ok).toBe(true)

    const comuna = validarCuentaProveedor({
      ...valido,
      modoCobertura: 'comuna',
      comunas: ['valdivia'],
    })
    expect(comuna.ok).toBe(true)
  })
})
