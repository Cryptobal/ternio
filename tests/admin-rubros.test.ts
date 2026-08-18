import { describe, expect, it } from 'vitest'
import { ModoRubro } from '@prisma/client'

import {
  parsearCamposEscritos,
  parsearDatosRubro,
  parsearPrecioClp,
  slugDesdeNombreRubro,
} from '@/lib/admin-rubros'

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
      nombre: 'Climatización de salas',
      modo: 'VENTA',
      activo: 'true',
    })
    expect(sinPrecios.ok).toBe(false)
    if (sinPrecios.ok) return
    expect(sinPrecios.motivo).toMatch(/precio/i)

    const unPrecio = parsearDatosRubro({
      nombre: 'Climatización de salas',
      modo: 'VENTA',
      precioExclusivoClp: '25000',
      activo: 'true',
    })
    expect(unPrecio.ok).toBe(false)

    const ok = parsearDatosRubro({
      nombre: 'Climatización de salas',
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
    expect(parsearDatosRubro({ nombre: 'Créditos', slug: 'creditos', modo: 'VENTA' }).ok).toBe(false)
    expect(parsearDatosRubro({ nombre: 'Gasfiter', slug: 'gasfiter', modo: 'VENTA' }).ok).toBe(false)
  })
})

describe('camposFormulario del admin', () => {
  const unCampo = [
    {
      nombre: 'tipo_servicio',
      etiqueta: '¿Qué necesitas?',
      tipo: 'radio',
      requerido: true,
      opciones: [{ valor: 'guardias', etiqueta: 'Guardias' }],
    },
  ]

  it('vacío o [] deja solo el tronco', () => {
    expect(parsearCamposEscritos('')).toEqual({ ok: true, campos: [] })
    expect(parsearCamposEscritos('[]')).toEqual({ ok: true, campos: [] })
    expect(parsearCamposEscritos(null)).toEqual({ ok: true, campos: [] })
  })

  it('acepta JSON válido y lo lee con parsearCampos', () => {
    const r = parsearCamposEscritos(JSON.stringify(unCampo))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.campos).toHaveLength(1)
    expect(r.campos[0]?.nombre).toBe('tipo_servicio')
  })

  it('JSON inválido o mal tipado falla el guardado; no degrada a []', () => {
    const jsonRoto = parsearCamposEscritos('{no es json')
    expect(jsonRoto.ok).toBe(false)
    if (!jsonRoto.ok) expect(jsonRoto.motivo).toMatch(/JSON/i)

    const schemaRoto = parsearCamposEscritos(
      JSON.stringify([{ nombre: 'MAYUSCULAS', etiqueta: 'x', tipo: 'texto' }]),
    )
    expect(schemaRoto.ok).toBe(false)

    const muchos = Array.from({ length: 7 }, (_, i) => ({
      nombre: `campo_${i}`,
      etiqueta: `Campo ${i}`,
      tipo: 'texto',
      requerido: false,
    }))
    const exceso = parsearCamposEscritos(JSON.stringify(muchos))
    expect(exceso.ok).toBe(false)
    if (!exceso.ok) expect(exceso.motivo).toMatch(/6/)
  })
})

describe('precios y slug', () => {
  it('lee 50.000 chileno y deja vacío como null', () => {
    expect(parsearPrecioClp('50.000')).toBe(50_000)
    expect(parsearPrecioClp('')).toBeNull()
    expect(slugDesdeNombreRubro('Control de acceso')).toBe('control-de-acceso')
  })
})
