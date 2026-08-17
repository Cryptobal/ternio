import { describe, expect, it } from 'vitest'
import { EstadoLead, ModoRubro } from '@prisma/client'

import { estadoInicialLead, rubroPuedeVender, textoEstadoComprador, validarModoRubro } from '@/lib/rubros'

const VENTA_OK = {
  modo: ModoRubro.VENTA,
  activo: true,
  precioExclusivoClp: 50_000,
  precioCompartidoClp: 20_000,
}

const CAPTURA = {
  modo: ModoRubro.CAPTURA,
  activo: true,
  precioExclusivoClp: null,
  precioCompartidoClp: null,
}

describe('rubroPuedeVender', () => {
  it('vende solo un rubro activo en VENTA con ambos precios', () => {
    expect(rubroPuedeVender(VENTA_OK)).toBe(true)
  })

  it('nunca vende un rubro en CAPTURA', () => {
    expect(rubroPuedeVender(CAPTURA)).toBe(false)
    // Ni siquiera si alguien le dejó precios cargados por error.
    expect(
      rubroPuedeVender({ ...CAPTURA, precioExclusivoClp: 50_000, precioCompartidoClp: 20_000 }),
    ).toBe(false)
  })

  it('no vende si falta un precio o si el rubro está inactivo', () => {
    expect(rubroPuedeVender({ ...VENTA_OK, precioExclusivoClp: null })).toBe(false)
    expect(rubroPuedeVender({ ...VENTA_OK, precioCompartidoClp: 0 })).toBe(false)
    expect(rubroPuedeVender({ ...VENTA_OK, activo: false })).toBe(false)
  })
})

describe('validarModoRubro', () => {
  it('acepta VENTA con ambos precios mayores a cero', () => {
    expect(validarModoRubro(VENTA_OK)).toEqual({ ok: true })
  })

  it('rechaza pasar a VENTA sin precios', () => {
    expect(validarModoRubro({ ...VENTA_OK, precioExclusivoClp: null }).ok).toBe(false)
    expect(validarModoRubro({ ...VENTA_OK, precioCompartidoClp: null }).ok).toBe(false)
    expect(validarModoRubro({ ...VENTA_OK, precioExclusivoClp: 0 }).ok).toBe(false)
  })

  it('no exige precios a un rubro en CAPTURA', () => {
    expect(validarModoRubro(CAPTURA)).toEqual({ ok: true })
  })
})

describe('estadoInicialLead', () => {
  it('manda a lista de espera los leads de rubros en CAPTURA', () => {
    expect(estadoInicialLead(ModoRubro.CAPTURA)).toBe(EstadoLead.LISTA_ESPERA)
  })

  it('manda a la cola de revisión los leads de rubros en VENTA', () => {
    expect(estadoInicialLead(ModoRubro.VENTA)).toBe(EstadoLead.RECIBIDO)
  })
})

describe('textoEstadoComprador', () => {
  it('habla en simple y cubre todos los estados', () => {
    for (const estado of Object.values(EstadoLead)) {
      const texto = textoEstadoComprador(estado)
      expect(texto.length).toBeGreaterThan(0)
      // Nada de jerga interna en el panel del comprador.
      expect(texto).not.toMatch(/LEAD|RECIBIDO|EN_REVISION/i)
    }
  })

  it('le dice al comprador de un rubro en captura qué está pasando', () => {
    expect(textoEstadoComprador(EstadoLead.LISTA_ESPERA)).toBe(
      'Estamos buscando proveedores en tu zona',
    )
    expect(textoEstadoComprador(EstadoLead.RECIBIDO)).toBe('Verificando tus datos')
  })
})
