import { describe, expect, it } from 'vitest'

import { destinoSelector } from '@/lib/selector-cotizacion'

describe('destinoSelector', () => {
  it('VENTA + comuna → /{rubro}/{comuna}', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' }, 'las-condes')).toBe(
      '/seguridad/las-condes',
    )
  })

  it('VENTA sin comuna → /{rubro}', () => {
    expect(destinoSelector({ slug: 'seguridad', modo: 'VENTA' })).toBe('/seguridad')
    expect(destinoSelector({ slug: 'aseo', modo: 'VENTA' }, '')).toBe('/aseo')
  })

  it('CAPTURA → /{rubro} aunque venga comuna', () => {
    expect(destinoSelector({ slug: 'climatizacion', modo: 'CAPTURA' })).toBe('/climatizacion')
    expect(destinoSelector({ slug: 'climatizacion', modo: 'CAPTURA' }, 'santiago')).toBe(
      '/climatizacion',
    )
  })
})
