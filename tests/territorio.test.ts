import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { COMUNAS_CHILE } from '../prisma/comunas-chile'
import {
  comunaPorSlug,
  comunasDe,
  filtrarComunas,
  pasoTerritorio,
  provinciasDe,
  regionesDe,
  slugificarNombre,
  territorioUnPasoVisible,
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

  it('la cascada pide región, después provincia, después comuna', () => {
    expect(pasoTerritorio('', '', '')).toBe('region')
    expect(pasoTerritorio('Región Metropolitana', '', '')).toBe('provincia')
    expect(pasoTerritorio('Región Metropolitana', 'Santiago', '')).toBe('comuna')
    expect(pasoTerritorio('Región Metropolitana', 'Santiago', 'providencia')).toBe('listo')
  })

  it('un paso: solo un nivel visible, nunca región + provincia + comuna apilados', () => {
    expect(territorioUnPasoVisible('', '', '')).toEqual({
      region: true,
      provincia: false,
      comuna: false,
    })
    expect(territorioUnPasoVisible('Región Metropolitana', '', '')).toEqual({
      region: false,
      provincia: true,
      comuna: false,
    })
    expect(territorioUnPasoVisible('Región Metropolitana', 'Santiago', '')).toEqual({
      region: false,
      provincia: false,
      comuna: true,
    })
    expect(territorioUnPasoVisible('Región Metropolitana', 'Santiago', 'providencia')).toEqual({
      region: false,
      provincia: false,
      comuna: true,
    })

    const pasos = [
      territorioUnPasoVisible('', '', ''),
      territorioUnPasoVisible('Región Metropolitana', '', ''),
      territorioUnPasoVisible('Región Metropolitana', 'Santiago', ''),
      territorioUnPasoVisible('Región Metropolitana', 'Santiago', 'providencia'),
    ]
    for (const visible of pasos) {
      expect([visible.region, visible.provincia, visible.comuna].filter(Boolean)).toHaveLength(1)
    }
  })

  it('la UI de territorio no apila niveles ni usa select nativo', () => {
    const territorio = readFileSync(
      resolve(process.cwd(), 'src/components/selector-territorio.tsx'),
      'utf8',
    )
    const home = readFileSync(
      resolve(process.cwd(), 'src/components/selector-cotizacion.tsx'),
      'utf8',
    )
    expect(territorio).toMatch(/territorioUnPasoVisible/)
    expect(territorio).not.toMatch(/<select/)
    expect(territorio).not.toMatch(/buscar comuna|typeahead/i)
    expect(home).not.toMatch(/<select/)
    expect(home).toMatch(/ChipMiga/)
  })
})
