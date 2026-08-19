import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SEMILLA_AUDIENCIAS_POR_SLUG, type Audiencia } from '@/lib/audiencia'

const MIGRATION = 'prisma/migrations/20260819040000_backfill_audiencias_hogar/migration.sql'

const HOGAR_ONLY = ['aseo-hogar', 'cuidado-adulto-mayor', 'tecnico-electrodomesticos'] as const

const DUALES = [
  'gasfiteria',
  'electricista',
  'destape',
  'pintura',
  'remodelaciones',
  'cerrajeria',
  'mudanzas',
  'jardineria',
  'control-de-plagas',
  'seguros',
  'asesoria-financiera',
] as const

const PRECIOS_HOGAR: Record<string, { exclusivo: number; compartido: number }> = {
  cerrajeria: { exclusivo: 8000, compartido: 3000 },
  'tecnico-electrodomesticos': { exclusivo: 8000, compartido: 3000 },
  'aseo-hogar': { exclusivo: 8000, compartido: 3000 },
  destape: { exclusivo: 10000, compartido: 4000 },
  jardineria: { exclusivo: 10000, compartido: 4000 },
  gasfiteria: { exclusivo: 12000, compartido: 5000 },
  electricista: { exclusivo: 12000, compartido: 5000 },
  pintura: { exclusivo: 15000, compartido: 6000 },
  mudanzas: { exclusivo: 15000, compartido: 6000 },
  'control-de-plagas': { exclusivo: 15000, compartido: 6000 },
  seguros: { exclusivo: 15000, compartido: 6000 },
  'cuidado-adulto-mayor': { exclusivo: 20000, compartido: 8000 },
  remodelaciones: { exclusivo: 25000, compartido: 10000 },
  'asesoria-financiera': { exclusivo: 25000, compartido: 10000 },
}

describe('migración backfill audiencias hogar', () => {
  const sql = readFileSync(resolve(process.cwd(), MIGRATION), 'utf8')

  it('no toca ledger, compras ni columnas destructivas', () => {
    expect(sql).not.toMatch(/DELETE FROM/i)
    expect(sql).not.toMatch(/DROP COLUMN/i)
    expect(sql).not.toMatch(/DROP TABLE/i)
    expect(sql).not.toMatch(/MovimientoCreditos|CompraLead/i)
  })

  it('marca los 3 hogar-only y los 11 duales', () => {
    for (const slug of HOGAR_ONLY) {
      expect(sql).toContain(`'${slug}'`)
    }
    expect(sql).toMatch(/ARRAY\['hogar'\]::TEXT\[\]/)
    for (const slug of DUALES) {
      expect(sql).toContain(`'${slug}'`)
    }
    expect(sql).toMatch(/ARRAY\['hogar',\s*'empresa'\]::TEXT\[\]/)
  })

  it('escribe precio hogar > 0 en los 14 rubros con guarda IS NULL', () => {
    for (const [slug, precios] of Object.entries(PRECIOS_HOGAR)) {
      expect(sql).toContain(`slug = '${slug}'`)
      expect(sql).toContain(`"precioExclusivoHogarClp" = ${precios.exclusivo}`)
      expect(sql).toContain(`"precioCompartidoHogarClp" = ${precios.compartido}`)
    }
    expect(sql).toMatch(/"precioExclusivoHogarClp" IS NULL/)
  })

  it('backfill de Cobertura solo sobre el default empresa', () => {
    expect(sql).toMatch(/UPDATE "Cobertura"/)
    expect(sql).toMatch(/c\."audiencias" = ARRAY\['empresa'\]::TEXT\[\]/)
    expect(sql).toMatch(/'hogar' = ANY \(r\."audiencias"\)/)
  })

  it('coincide exactamente con SEMILLA_AUDIENCIAS_POR_SLUG', () => {
    const porSlug = new Map<string, Audiencia[]>()
    for (const slug of HOGAR_ONLY) porSlug.set(slug, ['hogar'])
    for (const slug of DUALES) porSlug.set(slug, ['hogar', 'empresa'])

    for (const [slug, audiencias] of Object.entries(SEMILLA_AUDIENCIAS_POR_SLUG)) {
      if (audiencias.includes('hogar')) {
        expect(porSlug.get(slug)).toEqual([...audiencias])
      } else {
        expect(porSlug.has(slug)).toBe(false)
        expect(sql).not.toMatch(new RegExp(`slug = '${slug}'`))
      }
    }

    expect(porSlug.size).toBe(14)
    expect(Object.keys(SEMILLA_AUDIENCIAS_POR_SLUG)).toHaveLength(25)
  })
})
