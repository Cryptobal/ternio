import { describe, expect, it } from 'vitest'

import { COMUNAS_CHILE } from '../prisma/comunas-chile'
import {
  comunaPorSlug,
  comunasDe,
  debeMostrarNivelTerritorio,
  filtrarComunas,
  nivelListaTerritorio,
  pasoTerritorio,
  preguntaNivelTerritorio,
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

  it('la cascada pide región, después provincia, después comuna', () => {
    expect(pasoTerritorio('', '', '')).toBe('region')
    expect(pasoTerritorio('Región Metropolitana', '', '')).toBe('provincia')
    expect(pasoTerritorio('Región Metropolitana', 'Santiago', '')).toBe('comuna')
    expect(pasoTerritorio('Región Metropolitana', 'Santiago', 'providencia')).toBe('listo')
    expect(preguntaNivelTerritorio('region')).toBe('¿En qué región?')
    expect(preguntaNivelTerritorio('provincia')).toBe('¿En qué ciudad?')
    expect(preguntaNivelTerritorio('comuna')).toBe('¿En qué comuna?')
  })

  it('un solo nivel visible a la vez: nunca regiones + provincias + comunas juntas', () => {
    const vacio = { region: '', provincia: '', comuna: '' }
    const conRegion = { region: 'Región Metropolitana', provincia: '', comuna: '' }
    const conProvincia = { region: 'Región Metropolitana', provincia: 'Santiago', comuna: '' }
    const listo = {
      region: 'Región Metropolitana',
      provincia: 'Santiago',
      comuna: 'providencia',
    }

    expect(nivelListaTerritorio(vacio.region, vacio.provincia, vacio.comuna)).toBe('region')
    expect(debeMostrarNivelTerritorio('region', vacio.region, vacio.provincia, vacio.comuna)).toBe(true)
    expect(debeMostrarNivelTerritorio('provincia', vacio.region, vacio.provincia, vacio.comuna)).toBe(
      false,
    )
    expect(debeMostrarNivelTerritorio('comuna', vacio.region, vacio.provincia, vacio.comuna)).toBe(false)

    expect(nivelListaTerritorio(conRegion.region, conRegion.provincia, conRegion.comuna)).toBe(
      'provincia',
    )
    expect(
      debeMostrarNivelTerritorio('region', conRegion.region, conRegion.provincia, conRegion.comuna),
    ).toBe(false)
    expect(
      debeMostrarNivelTerritorio('provincia', conRegion.region, conRegion.provincia, conRegion.comuna),
    ).toBe(true)
    expect(
      debeMostrarNivelTerritorio('comuna', conRegion.region, conRegion.provincia, conRegion.comuna),
    ).toBe(false)

    expect(nivelListaTerritorio(conProvincia.region, conProvincia.provincia, conProvincia.comuna)).toBe(
      'comuna',
    )
    expect(
      debeMostrarNivelTerritorio(
        'provincia',
        conProvincia.region,
        conProvincia.provincia,
        conProvincia.comuna,
      ),
    ).toBe(false)
    expect(
      debeMostrarNivelTerritorio(
        'comuna',
        conProvincia.region,
        conProvincia.provincia,
        conProvincia.comuna,
      ),
    ).toBe(true)

    expect(nivelListaTerritorio(listo.region, listo.provincia, listo.comuna)).toBeNull()
    expect(debeMostrarNivelTerritorio('region', listo.region, listo.provincia, listo.comuna)).toBe(false)
    expect(debeMostrarNivelTerritorio('provincia', listo.region, listo.provincia, listo.comuna)).toBe(
      false,
    )
    expect(debeMostrarNivelTerritorio('comuna', listo.region, listo.provincia, listo.comuna)).toBe(false)

    expect(nivelListaTerritorio(listo.region, listo.provincia, listo.comuna, { multiple: true })).toBe(
      'comuna',
    )
    expect(
      debeMostrarNivelTerritorio('comuna', listo.region, listo.provincia, listo.comuna, {
        multiple: true,
      }),
    ).toBe(true)
    expect(
      debeMostrarNivelTerritorio('region', listo.region, listo.provincia, listo.comuna, {
        multiple: true,
      }),
    ).toBe(false)
  })
})
