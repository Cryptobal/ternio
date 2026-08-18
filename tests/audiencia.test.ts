import { describe, expect, it } from 'vitest'

import { RUBROS } from '../prisma/catalogo-inicial'
import {
  audienciaInicialParaPagina,
  audienciaParaLead,
  audienciasDe,
  filtrarServiciosPorAudiencia,
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
  it('etiqueta todos los rubros VENTA y deja overlap donde Carlos lo pidió', () => {
    for (const rubro of RUBROS) {
      expect(audienciasDe(rubro.slug).length, rubro.slug).toBeGreaterThan(0)
    }
    for (const slug of SOLO_HOGAR) {
      expect(audienciasDe(slug)).toEqual(['hogar'])
    }
    for (const slug of SOLO_EMPRESA) {
      expect(audienciasDe(slug)).toEqual(['empresa'])
    }
    for (const slug of AMBOS) {
      expect(audienciasDe(slug)).toEqual(['hogar', 'empresa'])
    }
    expect(rubroCalzaAudiencia('control-de-plagas', 'hogar')).toBe(true)
    expect(rubroCalzaAudiencia('abogados', 'hogar')).toBe(false)
    expect(rubroCalzaAudiencia('cerrajeria', 'empresa')).toBe(true)
  })

  it('en la landing precarga si es único y pregunta si es BOTH', () => {
    expect(audienciaInicialParaPagina('aseo-hogar')).toBe('hogar')
    expect(audienciaInicialParaPagina('seguridad')).toBe('empresa')
    expect(audienciaInicialParaPagina('gasfiteria')).toBe('')
    expect(audienciaInicialParaPagina('gasfiteria', 'empresa')).toBe('empresa')
    expect(audienciaInicialParaPagina('gasfiteria', 'casa')).toBe('hogar')
    expect(parsearAudiencia('casa')).toBe('hogar')
  })

  it('el lead guarda hogar|empresa; si es BOTH y no vino, no inventa', () => {
    expect(audienciaParaLead('hogar', 'gasfiteria')).toBe('hogar')
    expect(audienciaParaLead(undefined, 'seguridad')).toBe('empresa')
    expect(audienciaParaLead(undefined, 'gasfiteria')).toBeNull()
    expect(
      filtrarServiciosPorAudiencia(
        [{ slug: 'aseo' }, { slug: 'aseo-hogar' }, { slug: 'control-de-plagas' }],
        'hogar',
      ).map((r) => r.slug),
    ).toEqual(['aseo-hogar', 'control-de-plagas'])
  })
})
