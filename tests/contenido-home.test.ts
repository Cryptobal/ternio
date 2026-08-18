import { describe, expect, it } from 'vitest'

import {
  FAQ_HOME,
  audienciaCatalogoFallback,
  combosDestacados,
  enlacesCatalogo,
} from '@/lib/contenido-home'
import { jsonLdFaq } from '@/lib/seo-contenido'

describe('contenido-home', () => {
  it('FAQ tiene al menos 6 entradas no vacías', () => {
    expect(FAQ_HOME.length).toBeGreaterThanOrEqual(6)
    for (const item of FAQ_HOME) {
      expect(item.pregunta.trim().length).toBeGreaterThan(0)
      expect(item.respuesta.trim().length).toBeGreaterThan(0)
    }
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
      { slug: 'seguridad', nombre: 'Seguridad privada' },
      { slug: 'aseo-hogar', nombre: 'Aseo del hogar' },
      { slug: 'banos-quimicos', nombre: 'Baños químicos' },
      { slug: 'rubro-raro', nombre: 'Servicio raro' },
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
    expect(audienciaCatalogoFallback('rubro-raro')).toBe('empresa')

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
})
