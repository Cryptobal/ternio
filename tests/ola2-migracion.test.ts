import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SLUGS_OLA2 } from '@/lib/grupos-rubro'

describe('migración ola 2', () => {
  const sql = readFileSync(
    resolve(process.cwd(), 'prisma/migrations/20260818140000_ola2_rubros_venta/migration.sql'),
    'utf8',
  )

  it('inserta los 17 rubros VENTA sin tocar prueba-e2e ni créditos', () => {
    expect(sql).toMatch(/ON CONFLICT \(slug\) DO NOTHING/)
    expect(sql).toMatch(/INSERT INTO "RubroComuna"/)
    expect(sql).toMatch(/prueba-e2e/)
    expect(sql).not.toMatch(/DELETE FROM/)
    expect(sql).not.toMatch(/MovimientoCreditos|CREDITOS_ALTA|clawback/i)
    for (const slug of SLUGS_OLA2) {
      expect(sql).toContain(`'${slug}'`)
    }
  })
})
