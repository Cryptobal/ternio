import { describe, expect, it } from 'vitest'

import { COMUNAS_CHILE } from '../prisma/comunas-chile'
import {
  comunaPorSlug,
  comunasDe,
  filtrarComunas,
  provinciasDe,
  regionesDe,
  slugificarNombre,
} from '@/lib/territorio'

describe('territorio CUT', () => {
  it('ordena regiones de norte a sur y agrupa provincia → comuna', () => {
    const regiones = regionesDe(COMUNAS_CHILE)
    expect(regiones[0]).toBe('Región de Arica y Parinacota')
    expect(regiones.at(-1)).toBe('Región de Magallanes')
    expect(provinciasDe(COMUNAS_CHILE, 'Región Metropolitana')).toContain('Santiago')
    expect(comunasDe(COMUNAS_CHILE, 'Región Metropolitana', 'Santiago').map((c) => c.slug)).toContain(
      'las-condes',
    )
  })

  it('encuentra por slug y por búsqueda, sin inventar nombres', () => {
    expect(comunaPorSlug(COMUNAS_CHILE, 'nunoa')?.nombre).toBe('Ñuñoa')
    expect(filtrarComunas(COMUNAS_CHILE, 'Valdivia').some((c) => c.slug === 'valdivia')).toBe(true)
    expect(slugificarNombre('Ñuñoa')).toBe('nunoa')
    expect(slugificarNombre("O'Higgins")).toBe('o-higgins')
  })
})
