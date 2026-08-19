import { describe, expect, it } from 'vitest'

import {
  escalonesFrescura,
  etiquetaDesde,
  precioDesdeMinimo,
  precioVigente,
  rubrosConPrecioPublico,
  type RubroPrecio,
} from '@/lib/contenido-precios'

const BASE = new Date('2026-01-01T12:00:00.000Z')

describe('contenido-precios', () => {
  const muestra: RubroPrecio[] = [
    {
      slug: 'seguridad',
      nombre: 'Seguridad',
      modo: 'VENTA',
      audiencias: ['empresa'],
      precioExclusivoClp: 50_000,
      precioCompartidoClp: 20_000,
    },
    {
      slug: 'cerrajeria',
      nombre: 'Cerrajería',
      modo: 'VENTA',
      audiencias: ['hogar', 'empresa'],
      precioExclusivoClp: 8_000,
      precioCompartidoClp: 3_000,
      precioExclusivoHogarClp: 6_000,
      precioCompartidoHogarClp: 2_500,
    },
    {
      slug: 'espera',
      nombre: 'Lista de espera',
      modo: 'CAPTURA',
      audiencias: ['empresa'],
      precioExclusivoClp: 1,
      precioCompartidoClp: 1,
    },
    {
      slug: 'cero',
      nombre: 'Sin precio',
      modo: 'VENTA',
      audiencias: ['empresa'],
      precioExclusivoClp: 0,
      precioCompartidoClp: 10_000,
    },
  ]

  it('desde $X toma el mínimo real (incluye hogar)', () => {
    const lista = rubrosConPrecioPublico(muestra)
    expect(precioDesdeMinimo(lista)).toBe(2_500)
    expect(etiquetaDesde(2_500)).toMatch(/desde/)
  })

  it('lista vacía no revienta', () => {
    expect(rubrosConPrecioPublico([])).toEqual([])
    expect(precioDesdeMinimo([])).toBeNull()
    expect(etiquetaDesde(null)).toMatch(/Todavía no hay/)
  })

  it('los cuatro escalones coinciden con precioVigente', () => {
    const base = 10_000
    const escalones = escalonesFrescura(base)
    expect(escalones).toHaveLength(4)

    expect(escalones[0]!.precioEjemplo).toBe(
      precioVigente(base, BASE, new Date(BASE.getTime() + 1 * 60 * 60 * 1000)),
    )
    expect(escalones[1]!.precioEjemplo).toBe(
      precioVigente(base, BASE, new Date(BASE.getTime() + 36 * 60 * 60 * 1000)),
    )
    expect(escalones[2]!.precioEjemplo).toBe(
      precioVigente(base, BASE, new Date(BASE.getTime() + 4 * 24 * 60 * 60 * 1000)),
    )
    expect(escalones[3]!.precioEjemplo).toBeNull()
    expect(escalones[0]!.factor).toBe(1)
    expect(escalones[1]!.factor).toBe(0.8)
    expect(escalones[2]!.factor).toBe(0.5)
    expect(escalones[3]!.factor).toBeNull()
  })
})
