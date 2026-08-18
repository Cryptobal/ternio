import { describe, expect, it } from 'vitest'

import { destinoTrasLogin, ROLES } from '@/lib/roles'

describe('destinoTrasLogin', () => {
  it('usa capacidades, no el escalar de rol', () => {
    expect(
      destinoTrasLogin({ tieneCotizaciones: false, tienePerfilProveedor: true }),
    ).toBe('/panel')
    expect(
      destinoTrasLogin({ tieneCotizaciones: true, tienePerfilProveedor: false }),
    ).toBe('/mis-cotizaciones')
    expect(
      destinoTrasLogin({ tieneCotizaciones: true, tienePerfilProveedor: true }),
    ).toBe('/elegir')
    expect(
      destinoTrasLogin({ tieneCotizaciones: false, tienePerfilProveedor: false }),
    ).toBe('/mis-cotizaciones')
  })

  it('admin tiene prioridad', () => {
    expect(
      destinoTrasLogin({
        tieneCotizaciones: true,
        tienePerfilProveedor: true,
        esAdmin: true,
      }),
    ).toBe('/admin')
  })

  it('exporta ROLES para el edge y la UI', () => {
    expect(ROLES.PROVEEDOR).toBe('PROVEEDOR')
    expect(ROLES.COMPRADOR).toBe('COMPRADOR')
  })
})
