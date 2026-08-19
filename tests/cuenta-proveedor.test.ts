import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validarCuentaProveedor } from '@/lib/cuenta-proveedor'

describe('validarCuentaProveedor', () => {
  const valido = {
    nombreEmpresa: 'Guardias del Sur SpA',
    rut: '12.345.678-5',
    telefono: '+56 9 8123 4567',
    email: 'hola@guardias.cl',
    password: 'clave-segura-10',
    passwordConfirmacion: 'clave-segura-10',
    rubros: ['seguridad'],
    modoCobertura: 'nacional',
  }

  it('acepta una cuenta con cobertura nacional y contraseña', () => {
    const resultado = validarCuentaProveedor(valido)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.datos.cobertura.modo).toBe('nacional')
      expect(resultado.datos.password).toBe('clave-segura-10')
    }
  })

  it('exige RUT con DV, rubro, cobertura y contraseña', () => {
    expect(validarCuentaProveedor({ ...valido, rut: '76.482.113-4' }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, rubros: [] }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, nombreEmpresa: '' }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, modoCobertura: 'comuna', comunas: [] }).ok).toBe(false)
    expect(validarCuentaProveedor({ ...valido, password: 'corta' }).ok).toBe(false)
    expect(
      validarCuentaProveedor({
        ...valido,
        password: 'clave-segura-10',
        passwordConfirmacion: 'otra-clave-10',
      }).ok,
    ).toBe(false)
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

describe('copy del alta de proveedor', () => {
  it('no dice que el marketplace no está vivo; después del OTP se toman contactos', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/formulario-cuenta-proveedor.tsx'),
      'utf8',
    )
    expect(src).not.toContain('Aún no hay marketplace ni venta de leads')
    expect(src).toMatch(/Después de eso puedes tomar contactos/)
    expect(src).toMatch(/Contraseña/)
  })

  it('el alta reutiliza cuenta de comprador y guarda passwordHash', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/server/proveedores.ts'), 'utf8')
    expect(src).not.toMatch(/Este celular ya tiene una cuenta de cotizaciones/)
    expect(src).toContain('passwordHash')
    expect(src).toContain('telefonoE164Verificado: telefonoE164')
    expect(src).toContain('activarProveedorTrasOtp')
    expect(src).toContain('parcheOrigenAlta')
    expect(src).toContain('origenAltaDesdeQuery')
  })
})
