import { describe, expect, it } from 'vitest'

import { RUBROS } from '../prisma/catalogo-inicial'
import {
  audienciaInicialParaPagina,
  audienciaParaLead,
  audienciasDe,
  audienciasSemilla,
  filtrarServiciosPorAudiencia,
  normalizarAudiencias,
  parsearAudiencia,
  rubroCalzaAudiencia,
} from '@/lib/audiencia'

const SOLO_HOGAR = ['aseo-hogar', 'cuidado-adulto-mayor', 'tecnico-electrodomesticos']
const SOLO_EMPRESA = [
  'seguridad',
  'aseo',
  'banos-quimicos',
  'generadores',
  'transporte-de-personal',
  'transporte-de-carga',
  'climatizacion-industrial',
  'contabilidad',
  'marketing-digital',
  'abogados',
  'reclutamiento',
]
const AMBOS = [
  'gasfiteria',
  'electricista',
  'destape',
  'pintura',
  'remodelaciones',
  'mudanzas',
  'jardineria',
  'control-de-plagas',
  'cerrajeria',
  'seguros',
  'asesoria-financiera',
]

describe('audiencia hogar / empresa', () => {
  it('la semilla etiqueta todos los rubros VENTA; el runtime opera sobre datos', () => {
    for (const rubro of RUBROS) {
      expect(audienciasSemilla(rubro.slug).length, rubro.slug).toBeGreaterThan(0)
    }
    for (const slug of SOLO_HOGAR) {
      expect(audienciasSemilla(slug)).toEqual(['hogar'])
    }
    for (const slug of SOLO_EMPRESA) {
      expect(audienciasSemilla(slug)).toEqual(['empresa'])
    }
    for (const slug of AMBOS) {
      expect(audienciasSemilla(slug)).toEqual(['hogar', 'empresa'])
    }
    expect(rubroCalzaAudiencia(['hogar', 'empresa'], 'hogar')).toBe(true)
    expect(rubroCalzaAudiencia(['empresa'], 'hogar')).toBe(false)
    expect(normalizarAudiencias([])).toEqual(['empresa'])
    expect(audienciasDe(['hogar'])).toEqual(['hogar'])
  })

  it('en la landing precarga si es único y pregunta si es BOTH', () => {
    expect(audienciaInicialParaPagina(['hogar'])).toBe('hogar')
    expect(audienciaInicialParaPagina(['empresa'])).toBe('empresa')
    expect(audienciaInicialParaPagina(['hogar', 'empresa'])).toBe('')
    expect(audienciaInicialParaPagina(['hogar', 'empresa'], 'empresa')).toBe('empresa')
    expect(audienciaInicialParaPagina(['hogar', 'empresa'], 'casa')).toBe('hogar')
    expect(parsearAudiencia('casa')).toBe('hogar')
  })

  it('el lead guarda hogar|empresa; si es BOTH y no vino, no inventa', () => {
    expect(audienciaParaLead('hogar', ['hogar', 'empresa'])).toBe('hogar')
    expect(audienciaParaLead(undefined, ['empresa'])).toBe('empresa')
    expect(audienciaParaLead(undefined, ['hogar', 'empresa'])).toBeNull()
    expect(
      filtrarServiciosPorAudiencia(
        [
          { slug: 'aseo', audiencias: ['empresa'] },
          { slug: 'aseo-hogar', audiencias: ['hogar'] },
          { slug: 'control-de-plagas', audiencias: ['hogar', 'empresa'] },
        ],
        'hogar',
      ).map((r) => r.slug),
    ).toEqual(['aseo-hogar', 'control-de-plagas'])
  })
})
