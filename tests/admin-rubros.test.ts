import { describe, expect, it } from 'vitest'
import { ModoRubro } from '@prisma/client'

import { parsearDatosRubro, parsearPrecioClp, slugDesdeNombreRubro } from '@/lib/admin-rubros'

describe('admin crea / edita rubro', () => {
  it('CAPTURA no exige precios', () => {
    const r = parsearDatosRubro({
      nombre: 'Arriendo de grúas',
      modo: 'CAPTURA',
      activo: 'true',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.datos.modo).toBe(ModoRubro.CAPTURA)
    expect(r.datos.precioExclusivoClp).toBeNull()
    expect(r.datos.precioCompartidoClp).toBeNull()
    expect(r.datos.slug).toBe('arriendo-de-gruas')
    expect(r.datos.activo).toBe(true)
  })

  it('VENTA exige ambos precios > 0', () => {
    const sinPrecios = parsearDatosRubro({
      nombre: 'Climatización',
      modo: 'VENTA',
      activo: 'true',
    })
    expect(sinPrecios.ok).toBe(false)
    if (sinPrecios.ok) return
    expect(sinPrecios.motivo).toMatch(/precio/i)

    const unPrecio = parsearDatosRubro({
      nombre: 'Climatización',
      modo: 'VENTA',
      precioExclusivoClp: '25000',
      activo: 'true',
    })
    expect(unPrecio.ok).toBe(false)

    const ok = parsearDatosRubro({
      nombre: 'Climatización',
      modo: 'VENTA',
      precioExclusivoClp: '25.000',
      precioCompartidoClp: '10000',
      activo: 'true',
    })
    expect(ok.ok).toBe(true)
    if (!ok.ok) return
    expect(ok.datos.modo).toBe(ModoRubro.VENTA)
    expect(ok.datos.precioExclusivoClp).toBe(25_000)
    expect(ok.datos.precioCompartidoClp).toBe(10_000)
  })

  it('rechaza slugs reservados', () => {
    const r = parsearDatosRubro({ nombre: 'Admin', slug: 'admin', modo: 'CAPTURA' })
    expect(r.ok).toBe(false)
  })
})

describe('precios y slug', () => {
  it('lee 50.000 chileno y deja vacío como null', () => {
    expect(parsearPrecioClp('50.000')).toBe(50_000)
    expect(parsearPrecioClp('')).toBeNull()
    expect(slugDesdeNombreRubro('Control de acceso')).toBe('control-de-acceso')
  })
})
