import { describe, expect, it } from 'vitest'

import { copyCombo, copyRubro, titleCombo } from '@/lib/seo-contenido'
import {
  ALIAS_SEO_308,
  pathPublicoCombo,
  pathPublicoRubro,
  slugBdDesdePublico,
  slugsBdCandidatos,
  slugPublicoDesdeBd,
} from '@/lib/seo-rutas'
import { destinoSelector } from '@/lib/selector-cotizacion'

describe('rutas SEO públicas', () => {
  it('canónica de plagas es /control-de-plagas; /plagas es alias', () => {
    expect(slugPublicoDesdeBd('control-de-plagas')).toBe('control-de-plagas')
    expect(slugBdDesdePublico('plagas')).toBe('control-de-plagas')
    expect(pathPublicoRubro('control-de-plagas')).toBe('/control-de-plagas')
    expect(pathPublicoCombo('control-de-plagas', 'santiago')).toBe('/control-de-plagas/santiago')
    expect(slugsBdCandidatos('plagas')).toEqual(['plagas', 'control-de-plagas'])
    expect(slugsBdCandidatos('control-de-plagas')).toEqual(['control-de-plagas'])
  })

  it('alias 308 apuntan a canónicas reales', () => {
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/plagas', destino: '/control-de-plagas' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/plagas/:comuna', destino: '/control-de-plagas/:comuna' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/guardias-de-seguridad', destino: '/seguridad' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/guardias', destino: '/seguridad' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/empresas-de-aseo', destino: '/aseo' })
  })

  it('el selector usa la URL pública real', () => {
    expect(destinoSelector({ slug: 'control-de-plagas', modo: 'VENTA' }, 'santiago', true)).toBe(
      '/control-de-plagas/santiago',
    )
  })
})

describe('copy único por combo', () => {
  it('cambia el texto entre comunas del mismo rubro', () => {
    const santiago = copyCombo({
      slugBd: 'seguridad',
      nombreRubro: 'Servicio de seguridad',
      nombrePlural: 'Empresas de seguridad',
      comuna: 'Santiago',
      region: 'Región Metropolitana',
      provincia: 'Santiago',
    })
    const valdivia = copyCombo({
      slugBd: 'seguridad',
      nombreRubro: 'Servicio de seguridad',
      nombrePlural: 'Empresas de seguridad',
      comuna: 'Valdivia',
      region: 'Región de Los Ríos',
      provincia: 'Valdivia',
    })
    expect(santiago.h1).toContain('Santiago')
    expect(valdivia.h1).toContain('Valdivia')
    expect(santiago.intro).not.toBe(valdivia.intro)
  })

  it('el H1 del rubro no nombra una comuna; la ciudad va en el combo', () => {
    for (const slug of ['seguridad', 'aseo', 'control-de-plagas'] as const) {
      const copy = copyRubro(slug, 'Nombre', null)
      expect(copy.h1).not.toMatch(/Santiago|Valdivia|Providencia/i)
      expect(copy.title).not.toMatch(/Santiago|Valdivia|Providencia/i)
      expect(copy).not.toHaveProperty('atajoCombo')
    }
  })

  it('tiene H1 y title con los head terms de Semrush', () => {
    expect(copyRubro('seguridad', 'Empresas de seguridad', null).title).toBe('Guardias de seguridad')
    expect(copyRubro('aseo', 'Empresas de aseo', null).title).toBe('Empresas de aseo')
    expect(copyRubro('control-de-plagas', 'Empresas de control de plagas', null).title).toBe(
      'Control de plagas',
    )
    expect(titleCombo({ slugBd: 'aseo', nombrePlural: 'Empresas de aseo', comuna: 'Santiago' })).toBe(
      'Empresas de aseo en Santiago',
    )
  })
})
