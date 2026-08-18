import { describe, expect, it } from 'vitest'

import { audienciaPorDefecto, pasoCotizador } from '@/lib/audiencia'
import { claveCombo, destinoSelector, rubrosEnVenta } from '@/lib/selector-cotizacion'

describe('destinoSelector', () => {
  it('combo publicado → /{rubro}/{comuna}', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' }, 'las-condes', true)).toBe(
      '/seguridad/las-condes',
    )
    expect(destinoSelector({ slug: 'gasfiteria', modo: 'VENTA' }, 'santiago', true, 'hogar')).toBe(
      '/gasfiteria/santiago?audiencia=hogar',
    )
  })

  it('comuna sin página SEO → /{rubro}?comuna=', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' }, 'valdivia', false)).toBe(
      '/seguridad?comuna=valdivia',
    )
    expect(destinoSelector({ slug: 'gasfiteria', modo: 'VENTA' }, 'valdivia', false, 'empresa')).toBe(
      '/gasfiteria?comuna=valdivia&audiencia=empresa',
    )
  })

  it('sin comuna → /{rubro}', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' })).toBe('/seguridad')
    expect(destinoSelector({ slug: 'aseo', modo: 'VENTA' }, '')).toBe('/aseo')
  })

  it('CAPTURA también usa la página SEO si está publicada', () => {
    expect(destinoSelector({ slug: 'generadores', modo: 'CAPTURA' }, 'santiago', true)).toBe(
      '/generadores/santiago',
    )
    expect(destinoSelector({ slug: 'generadores', modo: 'CAPTURA' }, 'valdivia', false)).toBe(
      '/generadores?comuna=valdivia',
    )
  })

  it('arma la clave de combo publicado', () => {
    expect(claveCombo('seguridad', 'santiago')).toBe('seguridad/santiago')
  })

  it('las tarjetas Servicios son solo VENTA', () => {
    const lista = rubrosEnVenta([
      { modo: 'VENTA', slug: 'aseo' },
      { modo: 'CAPTURA', slug: 'generadores' },
      { modo: 'VENTA', slug: 'seguridad' },
    ])
    expect(lista.map((item) => item.slug)).toEqual(['aseo', 'seguridad'])
  })
})

describe('cascada del cotizador', () => {
  it('pide audiencia, después servicio, después territorio', () => {
    expect(pasoCotizador('', '')).toBe('audiencia')
    expect(pasoCotizador('hogar', '')).toBe('servicio')
    expect(pasoCotizador('hogar', 'gasfiteria')).toBe('territorio')
    expect(audienciaPorDefecto('seguridad')).toBe('empresa')
  })
})
