import { describe, expect, it } from 'vitest'

import {
  CATALOGO_HOME,
  FAQ_HOME,
  LUGAR_HOME,
  PROMESAS_HOME,
  audienciaCatalogoFallback,
  combosDeLugar,
  combosDestacados,
  enlacesCatalogo,
} from '@/lib/contenido-home'
import { CUPOS_COMPARTIDO } from '@/lib/matching'
import { jsonLdFaq } from '@/lib/seo-contenido'

describe('contenido-home', () => {
  it('FAQ tiene al menos 6 entradas no vacías', () => {
    expect(FAQ_HOME.length).toBeGreaterThanOrEqual(6)
    for (const item of FAQ_HOME) {
      expect(item.pregunta.trim().length).toBeGreaterThan(0)
      expect(item.respuesta.trim().length).toBeGreaterThan(0)
    }
  })

  it('PROMESAS_HOME tiene exactamente tres entradas coherentes con el producto', () => {
    expect(PROMESAS_HOME).toHaveLength(3)
    for (const promesa of PROMESAS_HOME) {
      expect(promesa.titulo.trim().length).toBeGreaterThan(0)
      expect(promesa.texto.trim().length).toBeGreaterThan(0)
    }
    const cupo = PROMESAS_HOME.find((p) => p.titulo.includes('empresas'))
    expect(cupo).toBeDefined()
    expect(cupo?.titulo).toContain(String(CUPOS_COMPARTIDO))
    expect(cupo?.texto.toLowerCase()).toContain('tres')
  })

  it('LUGAR_HOME no filtra copy de desarrollo', () => {
    const textos = `${LUGAR_HOME.titulo} ${LUGAR_HOME.bajada} ${LUGAR_HOME.vacio}`
    expect(LUGAR_HOME.titulo).not.toMatch(/cotiza en tu comuna/i)
    expect(textos).not.toMatch(/páginas ya publicadas|sin urls inventadas/i)
  })

  it('CATALOGO_HOME explica la lista de espera', () => {
    expect(CATALOGO_HOME.titulo.trim().length).toBeGreaterThan(0)
    expect(CATALOGO_HOME.notaEspera.toLowerCase()).toContain('lista de espera')
    expect(CATALOGO_HOME.notaEspera.toLowerCase()).toContain('gris')
  })

  it('JSON-LD FAQPage sale bien formado desde las mismas preguntas', () => {
    const ld = jsonLdFaq(FAQ_HOME)
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(FAQ_HOME.length)
    expect(ld.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: FAQ_HOME[0]?.pregunta,
    })
  })

  it('enlacesCatalogo: empresa primero, href solo con combos, fallback empresa', () => {
    const rubros = [
      { slug: 'seguridad', nombre: 'Seguridad privada', audiencias: ['empresa'] },
      { slug: 'aseo-hogar', nombre: 'Aseo del hogar', audiencias: ['hogar'] },
      { slug: 'banos-quimicos', nombre: 'Baños químicos', audiencias: ['empresa'] },
      { slug: 'rubro-raro', nombre: 'Servicio raro', audiencias: ['empresa'] },
    ]
    const grupos = enlacesCatalogo(rubros, [
      { rubro: 'seguridad', comuna: 'las-condes' },
      { rubro: 'aseo-hogar', comuna: 'santiago' },
    ])

    expect(grupos.map((g) => g.audiencia)).toEqual(['empresa', 'hogar'])
    const empresa = grupos[0]!
    expect(empresa.items.find((i) => i.slug === 'seguridad')?.href).toBe('/seguridad')
    expect(empresa.items.find((i) => i.slug === 'banos-quimicos')?.href).toBeNull()
    expect(empresa.items.find((i) => i.slug === 'rubro-raro')?.href).toBeNull()
    expect(audienciaCatalogoFallback([])).toBe('empresa')

    const hogar = grupos[1]!
    expect(hogar.items.find((i) => i.slug === 'aseo-hogar')?.href).toBe('/aseo-hogar')
  })

  it('combosDestacados prioriza seguridad, respeta el cap y no inventa URLs', () => {
    const combos = combosDestacados(
      [
        {
          rubroSlug: 'aseo',
          comunaSlug: 'santiago',
          rubroNombre: 'Aseo',
          comunaNombre: 'Santiago',
        },
        {
          rubroSlug: 'seguridad',
          comunaSlug: 'providencia',
          rubroNombre: 'Seguridad privada',
          comunaNombre: 'Providencia',
        },
        {
          rubroSlug: 'seguridad',
          comunaSlug: 'las-condes',
          rubroNombre: 'Seguridad privada',
          comunaNombre: 'Las Condes',
        },
        {
          rubroSlug: 'control-de-plagas',
          comunaSlug: 'nunoa',
          rubroNombre: 'Control de plagas',
          comunaNombre: 'Ñuñoa',
        },
      ],
      2,
    )

    expect(combos).toHaveLength(2)
    expect(combos[0]?.href).toBe('/seguridad/las-condes')
    expect(combos[0]?.etiqueta).toBe('Seguridad privada en Las Condes')
    expect(combos[1]?.href).toBe('/seguridad/providencia')
    expect(combos.every((c) => c.href.startsWith('/'))).toBe(true)
  })

  it('combosDeLugar lista solo la comuna pedida, en orden, sin inventar', () => {
    const enlaces = combosDeLugar(
      [
        {
          rubroSlug: 'seguridad',
          comunaSlug: 'las-condes',
          rubroNombre: 'Seguridad privada',
          comunaNombre: 'Las Condes',
        },
        {
          rubroSlug: 'aseo',
          comunaSlug: 'las-condes',
          rubroNombre: 'Aseo',
          comunaNombre: 'Las Condes',
        },
        {
          rubroSlug: 'seguridad',
          comunaSlug: 'santiago',
          rubroNombre: 'Seguridad privada',
          comunaNombre: 'Santiago',
        },
      ],
      'las-condes',
    )
    expect(enlaces.map((e) => e.href)).toEqual(['/aseo/las-condes', '/seguridad/las-condes'])
    expect(enlaces.every((e) => e.href.includes('las-condes'))).toBe(true)
    expect(combosDeLugar([], 'valdivia')).toEqual([])
  })
})
