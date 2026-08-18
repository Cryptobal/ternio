import { describe, expect, it } from 'vitest'

import {
  armarEmbudo,
  calcularIngresos,
  contarLeadsVendidos,
  evaluarGoNoGo,
  parsearInversionClp,
  parsearRango,
  percentil,
  resumenSla,
  tasa,
} from '@/lib/metricas-calculo'

describe('tasa', () => {
  it('devuelve 0 con denominador 0', () => {
    expect(tasa(5, 0)).toBe(0)
    expect(tasa(0, 0)).toBe(0)
  })

  it('calcula la proporción', () => {
    expect(tasa(25, 100)).toBe(0.25)
  })
})

describe('percentil', () => {
  it('con 0 muestras es null', () => {
    expect(percentil([], 50)).toBeNull()
  })

  it('con 1 muestra devuelve ese valor', () => {
    expect(percentil([42], 50)).toBe(42)
    expect(percentil([42], 95)).toBe(42)
  })

  it('con 2 muestras interpola', () => {
    expect(percentil([10, 20], 50)).toBe(15)
  })

  it('con n muestras calcula p50 y p95', () => {
    const n = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(percentil(n, 50)).toBe(5.5)
    expect(percentil(n, 95)).toBeCloseTo(9.55, 5)
  })
})

describe('armarEmbudo', () => {
  it('arma pasos con conversión al anterior y tolera ceros', () => {
    const resumen = armarEmbudo({
      visitas: 100,
      iniciosFormulario: 40,
      leadsCreados: 10,
      leadsVerificados: 0,
      leadsVendidos: 0,
      cuentasCreadas: 3,
    })
    expect(resumen.pasos).toHaveLength(5)
    expect(resumen.pasos[0]?.conversionDesdeAnterior).toBeNull()
    expect(resumen.pasos[1]?.conversionDesdeAnterior).toBe(0.4)
    expect(resumen.pasos[3]?.conversionDesdeAnterior).toBe(0)
    expect(resumen.pasos[4]?.conversionDesdeAnterior).toBeNull()
  })
})

describe('calcularIngresos y vendidos', () => {
  it('un lead con tres compras cuenta una vez como vendido y tres en ingresos', () => {
    expect(contarLeadsVendidos(['L1', 'L1', 'L1', 'L2'])).toBe(2)
    const ingresos = calcularIngresos({
      preciosPagados: [20_000, 20_000, 20_000],
      preciosReversados: [],
    })
    expect(ingresos.brutoClp).toBe(60_000)
    expect(ingresos.comprasPagadas).toBe(3)
    expect(ingresos.ticketPromedioClp).toBe(20_000)
  })

  it('resta reversas del neto', () => {
    const ingresos = calcularIngresos({
      preciosPagados: [50_000, 20_000],
      preciosReversados: [20_000],
    })
    expect(ingresos.brutoClp).toBe(70_000)
    expect(ingresos.reversasClp).toBe(20_000)
    expect(ingresos.netoClp).toBe(50_000)
  })
})

describe('resumenSla', () => {
  it('excluye avisos con 0 proveedores de los percentiles', () => {
    const sla = resumenSla([
      { msDesdeVerificado: 5_000, proveedoresAvisados: 2 },
      { msDesdeVerificado: 90_000, proveedoresAvisados: 0 },
      { msDesdeVerificado: 8_000, proveedoresAvisados: 1 },
    ])
    expect(sla.n).toBe(2)
    expect(sla.p50Ms).toBe(6_500)
    expect(sla.sobreSla).toBe(0)
    expect(sla.semaforo).toBe('verde')
  })

  it('marca rojo cuando p95 supera 120 s', () => {
    const sla = resumenSla([
      { msDesdeVerificado: 10_000, proveedoresAvisados: 1 },
      { msDesdeVerificado: 20_000, proveedoresAvisados: 1 },
      { msDesdeVerificado: 200_000, proveedoresAvisados: 1 },
    ])
    expect(sla.semaforo).toBe('rojo')
    expect(sla.sobreSla).toBe(1)
  })

  it('sin muestras queda sin-datos', () => {
    expect(resumenSla([]).semaforo).toBe('sin-datos')
  })
})

describe('evaluarGoNoGo', () => {
  it('verde si el costo por lead verificado es menor al 50 % del precio', () => {
    const r = evaluarGoNoGo({
      inversionClp: 900_000,
      leadsVerificados: 48,
      precioVentaRefClp: 50_000,
    })
    expect(r.costoPorLead).toBe(18_750)
    expect(r.umbralClp).toBe(25_000)
    expect(r.estado).toBe('verde')
  })

  it('sin datos si faltan verificados o precio', () => {
    expect(
      evaluarGoNoGo({ inversionClp: 100, leadsVerificados: 0, precioVentaRefClp: 50_000 }).estado,
    ).toBe('sin-datos')
    expect(
      evaluarGoNoGo({ inversionClp: 100, leadsVerificados: 2, precioVentaRefClp: null }).estado,
    ).toBe('sin-datos')
  })
})

describe('helpers de rango e inversión', () => {
  it('parsea rango con default 30d', () => {
    expect(parsearRango(undefined)).toBe('30d')
    expect(parsearRango('7d')).toBe('7d')
    expect(parsearRango('raro')).toBe('30d')
  })

  it('parsea inversión ignorando basura', () => {
    expect(parsearInversionClp('900.000')).toBe(900000)
    expect(parsearInversionClp('abc')).toBe(0)
  })
})
