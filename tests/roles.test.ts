import { describe, expect, it } from 'vitest'

import { destinoTrasLogin, ROLES } from '@/lib/roles'

describe('destinoTrasLogin', () => {
  it('manda al proveedor a /panel y al comprador a sus cotizaciones', () => {
    expect(destinoTrasLogin(ROLES.PROVEEDOR)).toBe('/panel')
    expect(destinoTrasLogin(ROLES.COMPRADOR)).toBe('/mis-cotizaciones')
    expect(destinoTrasLogin(undefined)).toBe('/mis-cotizaciones')
  })
})
