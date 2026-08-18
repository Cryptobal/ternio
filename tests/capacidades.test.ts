import { describe, expect, it } from 'vitest'

import { destinoPorCapacidades } from '@/lib/capacidades'

describe('destinoPorCapacidades', () => {
  it('manda a cotizaciones si solo tiene leads', () => {
    expect(
      destinoPorCapacidades({ tieneCotizaciones: true, tienePerfilProveedor: false }),
    ).toBe('/mis-cotizaciones')
  })

  it('manda al panel si solo tiene perfil de proveedor', () => {
    expect(
      destinoPorCapacidades({ tieneCotizaciones: false, tienePerfilProveedor: true }),
    ).toBe('/panel')
  })

  it('pide elegir si tiene ambas capacidades', () => {
    expect(
      destinoPorCapacidades({ tieneCotizaciones: true, tienePerfilProveedor: true }),
    ).toBe('/elegir')
  })

  it('cuenta huérfana (sin leads ni perfil) va a cotizaciones vacías', () => {
    expect(
      destinoPorCapacidades({ tieneCotizaciones: false, tienePerfilProveedor: false }),
    ).toBe('/mis-cotizaciones')
  })

  it('admin va a /admin aunque tenga otras capacidades', () => {
    expect(
      destinoPorCapacidades({
        tieneCotizaciones: true,
        tienePerfilProveedor: true,
        esAdmin: true,
      }),
    ).toBe('/admin')
  })
})
