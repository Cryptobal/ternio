import { describe, expect, it } from 'vitest'

import { COMUNAS_CHILE } from '../prisma/comunas-chile'
import {
  expandirCobertura,
  leerSeleccionCobertura,
  textoCobertura,
} from '@/lib/cobertura'

describe('cobertura', () => {
  it('Todo Chile no expande comunas', () => {
    const leida = leerSeleccionCobertura({ modo: 'nacional' })
    expect(leida.ok).toBe(true)
    if (!leida.ok) return
    expect(expandirCobertura(COMUNAS_CHILE, leida.datos)).toEqual({ nacional: true, slugs: [] })
    expect(textoCobertura(leida.datos)).toBe('Todo Chile')
  })

  it('por región expande las comunas de esa región', () => {
    const leida = leerSeleccionCobertura({
      modo: 'region',
      regiones: ['Región de Los Ríos'],
    })
    expect(leida.ok).toBe(true)
    if (!leida.ok) return
    const expansion = expandirCobertura(COMUNAS_CHILE, leida.datos)
    expect(expansion.nacional).toBe(false)
    expect(expansion.slugs).toContain('valdivia')
    expect(expansion.slugs.length).toBeGreaterThan(1)
  })

  it('por provincia expande solo esa provincia', () => {
    const leida = leerSeleccionCobertura({
      modo: 'provincia',
      provincias: ['Región Metropolitana|Santiago'],
    })
    expect(leida.ok).toBe(true)
    if (!leida.ok) return
    const expansion = expandirCobertura(COMUNAS_CHILE, leida.datos)
    expect(expansion.slugs).toContain('las-condes')
    expect(expansion.slugs).not.toContain('valdivia')
  })

  it('todas las regiones equivalen a Todo Chile', () => {
    const regiones = [...new Set(COMUNAS_CHILE.map((comuna) => comuna.region))]
    const leida = leerSeleccionCobertura({ modo: 'region', regiones })
    expect(leida.ok).toBe(true)
    if (!leida.ok) return
    expect(expandirCobertura(COMUNAS_CHILE, leida.datos).nacional).toBe(true)
  })
})
