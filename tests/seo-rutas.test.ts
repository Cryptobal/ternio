import { describe, expect, it } from 'vitest'

import { copyCombo, copyRubro } from '@/lib/seo-contenido'
import {
  ALIAS_SEO_308,
  pathPublicoCombo,
  pathPublicoRubro,
  slugBdDesdePublico,
  slugPublicoDesdeBd,
} from '@/lib/seo-rutas'
import { destinoSelector } from '@/lib/selector-cotizacion'

describe('rutas SEO públicas', () => {
  it('plagas es canónica; control-de-plagas es el slug de BD', () => {
    expect(slugBdDesdePublico('plagas')).toBe('control-de-plagas')
    expect(slugPublicoDesdeBd('control-de-plagas')).toBe('plagas')
    expect(pathPublicoRubro('control-de-plagas')).toBe('/plagas')
    expect(pathPublicoCombo('control-de-plagas', 'santiago')).toBe('/plagas/santiago')
  })

  it('alias 308 apuntan a canónicas', () => {
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/control-de-plagas', destino: '/plagas' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/guardias-de-seguridad', destino: '/seguridad' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/guardias', destino: '/seguridad' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/empresas-de-aseo', destino: '/aseo' })
  })

  it('el selector usa la URL pública', () => {
    expect(destinoSelector({ slug: 'control-de-plagas', modo: 'VENTA' }, 'santiago', true)).toBe(
      '/plagas/santiago',
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

  it('tiene H1 propio para seguridad, aseo y plagas', () => {
    expect(copyRubro('seguridad', 'Empresas de seguridad', null).h1).toMatch(/Guardias/i)
    expect(copyRubro('aseo', 'Empresas de aseo', null).h1).toMatch(/Aseo/i)
    expect(copyRubro('control-de-plagas', 'Empresas de control de plagas', null).h1).toMatch(
      /plagas/i,
    )
  })
})
