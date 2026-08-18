import { describe, expect, it } from 'vitest'

import { claveCombo, destinoSelector } from '@/lib/selector-cotizacion'

describe('destinoSelector', () => {
  it('combo publicado → /{rubro}/{comuna}', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' }, 'las-condes', true)).toBe(
      '/seguridad/las-condes',
    )
  })

  it('comuna sin página SEO → /{rubro}?comuna=', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' }, 'valdivia', false)).toBe(
      '/seguridad?comuna=valdivia',
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
})
