import { describe, expect, it } from 'vitest'

import { CREDITOS_ALTA, claveAsientoAlta } from '@/lib/creditos'
import {
  GARD_NOMBRE,
  GARD_SLUG,
  SNAPSHOT_COBERTURA_GARD,
  debeAcreditarPackGard,
} from '@/lib/gard'

describe('Gard · ensure', () => {
  it('ancla slug, nombre y cobertura nacional de seguridad', () => {
    expect(GARD_SLUG).toBe('gard-security')
    expect(GARD_NOMBRE).toBe('Gard Security')
    expect(SNAPSHOT_COBERTURA_GARD).toEqual({
      modo: 'nacional',
      regiones: [],
      provincias: [],
      comunas: [],
      rubros: ['seguridad'],
    })
  })

  it('acredita pack de arranque solo si saldo 0 y no hay asiento alta', () => {
    const id = 'prov_gard'
    expect(debeAcreditarPackGard(0, [], id)).toBe(true)
    expect(debeAcreditarPackGard(0, [claveAsientoAlta(id)], id)).toBe(false)
    expect(debeAcreditarPackGard(200_000, [], id)).toBe(false)
    expect(CREDITOS_ALTA).toBe(200_000)
  })
})
