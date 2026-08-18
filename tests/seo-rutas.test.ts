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
    expect(ALIAS_SEO_308).toContainEqual({
      origen: '/climatizacion',
      destino: '/climatizacion-industrial',
    })
    expect(ALIAS_SEO_308).toContainEqual({
      origen: '/climatizacion/:comuna',
      destino: '/climatizacion-industrial/:comuna',
    })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/gasfiter', destino: '/gasfiteria' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/maestro', destino: '/remodelaciones' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/obras', destino: '/remodelaciones' })
    expect(ALIAS_SEO_308).toContainEqual({ origen: '/creditos', destino: '/asesoria-financiera' })
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
    for (const slug of [
      'seguridad',
      'aseo',
      'control-de-plagas',
      'banos-quimicos',
      'generadores',
      'transporte-de-personal',
      'transporte-de-carga',
      'climatizacion-industrial',
      'gasfiteria',
      'aseo-hogar',
      'asesoria-financiera',
      'seguros',
    ] as const) {
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
    expect(copyRubro('banos-quimicos', 'Empresas de arriendo de baños químicos', null).title).toBe(
      'Arriendo de baños químicos',
    )
    expect(copyRubro('generadores', 'Empresas de arriendo de generadores', null).title).toBe(
      'Arriendo de generadores',
    )
    expect(copyRubro('transporte-de-personal', 'Empresas de transporte de personal', null).title).toBe(
      'Transporte de personal',
    )
    expect(copyRubro('transporte-de-carga', 'Empresas de transporte de carga', null).title).toBe(
      'Transporte de carga',
    )
    expect(copyRubro('climatizacion-industrial', 'Empresas de climatización industrial', null).title).toBe(
      'Climatización industrial',
    )
    expect(copyRubro('climatizacion', 'Empresas de climatización industrial', null).title).toBe(
      'Climatización industrial',
    )
    expect(copyRubro('gasfiter', 'Gasfitería', null).title).toBe('Gasfitería')
    expect(copyRubro('maestro', 'Remodelaciones', null).title).toBe('Remodelaciones')
    expect(copyRubro('creditos', 'Créditos', null).title).toBe('Créditos y asesoría financiera')
  })

  it('cada landing VENTA tiene title e H1 propios, sin copy de lista de espera', () => {
    const slugs = [
      'seguridad',
      'aseo',
      'control-de-plagas',
      'banos-quimicos',
      'generadores',
      'transporte-de-personal',
      'transporte-de-carga',
      'climatizacion-industrial',
      'gasfiteria',
      'electricista',
      'destape',
      'pintura',
      'remodelaciones',
      'cerrajeria',
      'tecnico-electrodomesticos',
      'mudanzas',
      'jardineria',
      'aseo-hogar',
      'cuidado-adulto-mayor',
      'contabilidad',
      'marketing-digital',
      'abogados',
      'reclutamiento',
      'asesoria-financiera',
      'seguros',
    ] as const
    const titles = slugs.map((slug) => copyRubro(slug, 'Nombre', null).title)
    const h1s = slugs.map((slug) => copyRubro(slug, 'Nombre', null).h1)
    expect(new Set(titles).size).toBe(slugs.length)
    expect(new Set(h1s).size).toBe(slugs.length)
    for (const slug of slugs) {
      const copy = copyRubro(slug, 'Nombre', null)
      expect(copy.intro).not.toMatch(/te avisamos|lista de espera|sumando empresas/i)
      expect(copy.cta).toMatch(/cotizaci/i)
    }
  })

  it('el copy financiero no vende cuentas ni se hace pasar por banco', () => {
    const creditos = copyRubro('asesoria-financiera', 'Créditos', null)
    const seguros = copyRubro('seguros', 'Seguros', null)
    expect(creditos.intro).toMatch(/asesores|corredores/i)
    expect(creditos.intro).toMatch(/no es un banco/i)
    expect(`${creditos.h1} ${creditos.intro} ${creditos.description}`).not.toMatch(/abrir cuenta/i)
    expect(seguros.intro).toMatch(/corredores/i)
    expect(seguros.intro).toMatch(/no vende pólizas|no es una aseguradora/i)
  })
})
