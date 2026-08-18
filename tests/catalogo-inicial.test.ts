import { describe, expect, it } from 'vitest'
import { ModoRubro } from '@prisma/client'

import { COMUNAS, COMUNAS_SEO, RUBROS } from '../prisma/catalogo-inicial'
import { camposFormularioSchema } from '@/lib/campos'
import { rubroPuedeVender, validarModoRubro } from '@/lib/rubros'

describe('catálogo de lanzamiento', () => {
  it('trae 8 rubros: 3 en VENTA y 5 en CAPTURA', () => {
    expect(RUBROS).toHaveLength(8)
    expect(RUBROS.filter((rubro) => rubro.modo === ModoRubro.VENTA)).toHaveLength(3)
    expect(RUBROS.filter((rubro) => rubro.modo === ModoRubro.CAPTURA)).toHaveLength(5)
  })

  it('los rubros en VENTA llevan los precios acordados', () => {
    const porSlug = new Map(RUBROS.map((rubro) => [rubro.slug, rubro]))

    expect(porSlug.get('seguridad')?.precioExclusivoClp).toBe(50_000)
    expect(porSlug.get('seguridad')?.precioCompartidoClp).toBe(20_000)
    expect(porSlug.get('aseo')?.precioExclusivoClp).toBe(25_000)
    expect(porSlug.get('aseo')?.precioCompartidoClp).toBe(10_000)
    expect(porSlug.get('control-de-plagas')?.precioExclusivoClp).toBe(15_000)
    expect(porSlug.get('control-de-plagas')?.precioCompartidoClp).toBe(6_000)
  })

  it('los rubros en CAPTURA van sin precios y no pueden vender', () => {
    for (const rubro of RUBROS.filter((r) => r.modo === ModoRubro.CAPTURA)) {
      expect(rubro.precioExclusivoClp).toBeNull()
      expect(rubro.precioCompartidoClp).toBeNull()
      expect(rubroPuedeVender({ ...rubro, activo: true })).toBe(false)
    }
  })

  it('todos los rubros pasan la validación de modo que corre el seed', () => {
    for (const rubro of RUBROS) {
      expect(validarModoRubro({ ...rubro, activo: true })).toEqual({ ok: true })
    }
  })

  it('los campos de formulario son válidos para el schema que lee la app', () => {
    for (const rubro of RUBROS) {
      const resultado = camposFormularioSchema.safeParse(rubro.campos)
      expect(resultado.success, `campos inválidos en "${rubro.slug}"`).toBe(true)
    }
  })

  it('no repite slugs: el seed hace upsert por slug', () => {
    expect(new Set(RUBROS.map((rubro) => rubro.slug)).size).toBe(RUBROS.length)
    expect(new Set(COMUNAS.map((comuna) => comuna.slug)).size).toBe(COMUNAS.length)
  })

  it('trae las 346 comunas del CUT y conserva los slugs piloto', () => {
    expect(COMUNAS).toHaveLength(346)
    expect(new Set(COMUNAS.map((comuna) => comuna.cut)).size).toBe(346)
    expect(COMUNAS_SEO).toEqual([
      'santiago',
      'las-condes',
      'providencia',
      'vitacura',
      'nunoa',
      'maipu',
      'quilicura',
      'pudahuel',
    ])
    const slugs = COMUNAS.map((comuna) => comuna.slug)
    for (const slug of COMUNAS_SEO) {
      expect(slugs).toContain(slug)
    }
    const santiago = COMUNAS.find((comuna) => comuna.slug === 'santiago')
    expect(santiago).toMatchObject({
      nombre: 'Santiago',
      region: 'Región Metropolitana',
      provincia: 'Santiago',
      cut: '13101',
    })
    expect(new Set(COMUNAS.map((comuna) => comuna.region)).size).toBe(16)
    expect(new Set(COMUNAS.map((comuna) => `${comuna.region}/${comuna.provincia}`)).size).toBe(56)
  })

  it('usa slugs limpios para las URL programáticas', () => {
    for (const slug of [...RUBROS.map((r) => r.slug), ...COMUNAS.map((c) => c.slug)]) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })
})
