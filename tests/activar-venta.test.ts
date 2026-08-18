import { describe, expect, it } from 'vitest'
import { ModoRubro } from '@prisma/client'

import {
  cambioActivacionVenta,
  contenidoSeoEsListaEspera,
  esRubroPruebaE2E,
  esSlugActivarVenta,
  precioVentaSinPisar,
  PRECIOS_ACTIVAR_VENTA,
  SLUGS_ACTIVAR_VENTA,
} from '@/lib/activar-venta'

const esperaSeo = {
  intro: 'Todavía estamos sumando empresas. Déjanos tu solicitud y te avisamos.',
  porQue: 'Queda en lista de espera.',
}

describe('activar rubros de lista de espera a VENTA', () => {
  it('cubre exactamente los 5 slugs de waitlist', () => {
    expect(SLUGS_ACTIVAR_VENTA).toEqual([
      'banos-quimicos',
      'generadores',
      'transporte-de-personal',
      'transporte-de-carga',
      'climatizacion-industrial',
    ])
    expect(esSlugActivarVenta('generadores')).toBe(true)
    expect(esSlugActivarVenta('seguridad')).toBe(false)
    expect(esSlugActivarVenta('prueba-e2e')).toBe(false)
  })

  it('no toca Prueba E2E aunque esté activo y en CAPTURA', () => {
    expect(esRubroPruebaE2E('prueba-e2e', 'Prueba E2E')).toBe(true)
    expect(
      cambioActivacionVenta(
        {
          slug: 'prueba-e2e',
          nombre: 'Prueba E2E',
          modo: ModoRubro.CAPTURA,
          activo: false,
          precioExclusivoClp: null,
          precioCompartidoClp: null,
        },
        PRECIOS_ACTIVAR_VENTA.generadores,
      ),
    ).toBeNull()
  })

  it('no reactiva un rubro apagado', () => {
    expect(
      cambioActivacionVenta(
        {
          slug: 'generadores',
          modo: ModoRubro.CAPTURA,
          activo: false,
          precioExclusivoClp: null,
          precioCompartidoClp: null,
        },
        PRECIOS_ACTIVAR_VENTA.generadores,
      ),
    ).toBeNull()
  })

  it('pasa CAPTURA a VENTA y pone precios solo si faltan', () => {
    const cambio = cambioActivacionVenta(
      {
        slug: 'banos-quimicos',
        modo: ModoRubro.CAPTURA,
        activo: true,
        precioExclusivoClp: null,
        precioCompartidoClp: null,
        contenidoSeo: esperaSeo,
      },
      PRECIOS_ACTIVAR_VENTA['banos-quimicos'],
    )
    expect(cambio).toEqual({
      modo: 'VENTA',
      precioExclusivoClp: 15_000,
      precioCompartidoClp: 6_000,
      actualizarContenidoSeo: true,
    })
  })

  it('respeta precios ya cargados en admin', () => {
    const cambio = cambioActivacionVenta(
      {
        slug: 'generadores',
        modo: ModoRubro.CAPTURA,
        activo: true,
        precioExclusivoClp: 40_000,
        precioCompartidoClp: 12_000,
        contenidoSeo: esperaSeo,
      },
      PRECIOS_ACTIVAR_VENTA.generadores,
    )
    expect(cambio?.precioExclusivoClp).toBe(40_000)
    expect(cambio?.precioCompartidoClp).toBe(12_000)
    expect(precioVentaSinPisar(40_000, 25_000)).toBe(40_000)
    expect(precioVentaSinPisar(0, 25_000)).toBe(25_000)
  })

  it('no reescribe un rubro que ya está en VENTA con precios y copy de cotizar', () => {
    expect(
      cambioActivacionVenta(
        {
          slug: 'climatizacion-industrial',
          modo: ModoRubro.VENTA,
          activo: true,
          precioExclusivoClp: 25_000,
          precioCompartidoClp: 10_000,
          contenidoSeo: { intro: 'Te contactan empresas de climatización.' },
        },
        PRECIOS_ACTIVAR_VENTA['climatizacion-industrial'],
      ),
    ).toBeNull()
    expect(contenidoSeoEsListaEspera({ intro: 'Te contactan empresas.' })).toBe(false)
  })
})
