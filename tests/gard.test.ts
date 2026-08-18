import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CREDITOS_ALTA, claveAsientoAlta } from '@/lib/creditos'
import {
  GARD_NOMBRE,
  GARD_RUT,
  GARD_SLUG,
  SNAPSHOT_COBERTURA_GARD,
  debeAcreditarPackGard,
  elegirFilaProveedorPorRut,
  esRutGard,
  slugAltaProveedor,
} from '@/lib/gard'
import { normalizarRut } from '@/lib/rut'

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

  it('el RUT canónico es cuerpo-DV, nunca solo dígitos', () => {
    expect(GARD_RUT).toBe('77840623-3')
    expect(GARD_RUT).toBe(normalizarRut('778406233'))
    expect(GARD_RUT).toBe(normalizarRut('77.840.623-3'))
    expect(GARD_RUT).not.toBe('778406233')
    expect(esRutGard('778406233')).toBe(true)
    expect(esRutGard('12.345.678-5')).toBe(false)
  })

  it('acredita pack de arranque solo si saldo 0 y no hay asiento alta', () => {
    const id = 'prov_gard'
    expect(debeAcreditarPackGard(0, [], id)).toBe(true)
    expect(debeAcreditarPackGard(0, [claveAsientoAlta(id)], id)).toBe(false)
    expect(debeAcreditarPackGard(200_000, [], id)).toBe(false)
    expect(CREDITOS_ALTA).toBe(200_000)
  })
})

describe('Gard · alta por RUT', () => {
  it('si hay dos filas, gana gard-security; no inventa prov-*', () => {
    expect(
      elegirFilaProveedorPorRut([{ slug: 'prov-77840623' }, { slug: 'gard-security' }])?.slug,
    ).toBe('gard-security')
    expect(slugAltaProveedor('77840623-3')).toBe('gard-security')
    expect(slugAltaProveedor('778406233')).toBe('gard-security')
    expect(slugAltaProveedor('12.345.678-5')).toBe('prov-12345678')
    expect(slugAltaProveedor('77840623-3', 'gard-security')).toBe('gard-security')
  })

  it('ensure y el alta persisten via normalizarRut, sin upsert ciego', () => {
    const gard = readFileSync(resolve(process.cwd(), 'src/lib/gard.ts'), 'utf8')
    const alta = readFileSync(resolve(process.cwd(), 'src/server/proveedores.ts'), 'utf8')
    expect(gard).toMatch(/normalizarRut\('77\.840\.623-3'\)/)
    expect(gard).not.toMatch(/rutNormalizado:\s*'778406233'/)
    expect(alta).toMatch(/variantesRutPersistido/)
    expect(alta).toMatch(/elegirFilaProveedorPorRut/)
    expect(alta).not.toMatch(/upsert\(/)
  })
})
