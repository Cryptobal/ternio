import { describe, expect, it } from 'vitest'

import { validarListaEspera } from '@/lib/lista-espera'

describe('validarListaEspera', () => {
  const valido = {
    nombreEmpresa: 'Guardias del Sur SpA',
    rut: '12.345.678-5',
    telefono: '+56 9 8123 4567',
    email: 'hola@guardias.cl',
    rubros: ['seguridad'],
    region: 'Región de Los Ríos',
    provincia: 'Valdivia',
    comunas: ['valdivia'],
  }

  it('acepta una inscripción mínima', () => {
    const resultado = validarListaEspera(valido)
    expect(resultado.ok).toBe(true)
  })

  it('bloquea RUT con DV malo, sin rubro o sin comuna', () => {
    expect(validarListaEspera({ ...valido, rut: '76.482.113-4' }).ok).toBe(false)
    expect(validarListaEspera({ ...valido, rubros: [] }).ok).toBe(false)
    expect(validarListaEspera({ ...valido, comunas: [] }).ok).toBe(false)
    expect(validarListaEspera({ ...valido, nombreEmpresa: '' }).ok).toBe(false)
  })
})
