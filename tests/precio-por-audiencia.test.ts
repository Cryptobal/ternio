import { describe, expect, it } from 'vitest'

import {
  precioBasePorAudiencia,
  precioVigente,
  type TipoToma,
} from '@/lib/matching'

/**
 * Ejemplo del brief: control-de-plagas.
 * Empresa $15.000 / $6.000; hogar $8.000 / $3.000.
 */
const RUBRO_PLAGAS = {
  precioExclusivoClp: 15_000,
  precioCompartidoClp: 6_000,
  precioExclusivoHogarClp: 8_000,
  precioCompartidoHogarClp: 3_000,
}

const verificadoAt = new Date('2026-08-18T10:00:00.000Z')

function vigente(
  audiencia: 'hogar' | 'empresa' | null,
  tipo: TipoToma,
  ahoraIso: string,
  rubro: {
    precioExclusivoClp: number | null
    precioCompartidoClp: number | null
    precioExclusivoHogarClp?: number | null
    precioCompartidoHogarClp?: number | null
  } = RUBRO_PLAGAS,
) {
  const base = precioBasePorAudiencia({ audiencia, tipo, rubro })
  return precioVigente(base, verificadoAt, new Date(ahoraIso))
}

describe('precio por audiencia (brief §5)', () => {
  it('lead hogar a las 12:00 (2 h → 100 %): compartido 3000, exclusivo 8000', () => {
    expect(vigente('hogar', 'COMPARTIDO', '2026-08-18T12:00:00.000Z')).toBe(3_000)
    expect(vigente('hogar', 'EXCLUSIVO', '2026-08-18T12:00:00.000Z')).toBe(8_000)
  })

  it('lead hogar a las 40 h (−20 %): compartido 2400', () => {
    // verificado 10:00 + 40 h = 2026-08-20T02:00
    expect(vigente('hogar', 'COMPARTIDO', '2026-08-20T02:00:00.000Z')).toBe(2_400)
  })

  it('lead empresa usa precios de empresa, no de hogar', () => {
    expect(vigente('empresa', 'EXCLUSIVO', '2026-08-18T12:00:00.000Z')).toBe(15_000)
    expect(vigente('empresa', 'COMPARTIDO', '2026-08-18T12:00:00.000Z')).toBe(6_000)
  })

  it('audiencia null (leads viejos) se cobra como empresa', () => {
    expect(vigente(null, 'EXCLUSIVO', '2026-08-18T12:00:00.000Z')).toBe(15_000)
    expect(precioBasePorAudiencia({ audiencia: null, tipo: 'COMPARTIDO', rubro: RUBRO_PLAGAS })).toBe(
      6_000,
    )
  })

  it('sin precio de hogar → no vende (null, sin fallback a empresa)', () => {
    const sinHogar = {
      ...RUBRO_PLAGAS,
      precioExclusivoHogarClp: null,
      precioCompartidoHogarClp: null,
    }
    expect(
      precioBasePorAudiencia({ audiencia: 'hogar', tipo: 'COMPARTIDO', rubro: sinHogar }),
    ).toBeNull()
    expect(vigente('hogar', 'COMPARTIDO', '2026-08-18T12:00:00.000Z', sinHogar)).toBeNull()
    expect(vigente('hogar', 'EXCLUSIVO', '2026-08-18T12:00:00.000Z', sinHogar)).toBeNull()
  })

  it('precio hogar ≤ 0 tampoco vende', () => {
    const cero = { ...RUBRO_PLAGAS, precioCompartidoHogarClp: 0 }
    expect(precioBasePorAudiencia({ audiencia: 'hogar', tipo: 'COMPARTIDO', rubro: cero })).toBe(0)
    expect(precioVigente(0, verificadoAt, new Date('2026-08-18T12:00:00.000Z'))).toBeNull()
  })

  it('freshness 50 % sobre base hogar (después de 72 h)', () => {
    // 10:00 + 73 h = 2026-08-21T11:00
    expect(vigente('hogar', 'COMPARTIDO', '2026-08-21T11:00:00.000Z')).toBe(1_500)
    expect(vigente('hogar', 'EXCLUSIVO', '2026-08-21T11:00:00.000Z')).toBe(4_000)
  })
})
