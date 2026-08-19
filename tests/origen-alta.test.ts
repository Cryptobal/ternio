import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  origenAltaDesdeQuery,
  origenAltaDesdeUrl,
  parcheOrigenAlta,
  resolverOrigenAlta,
  sanitizarOrigenAlta,
} from '@/lib/origen-alta'

const URL_OUTREACH =
  'https://www.ternio.cl/proveedores?utm_source=email&utm_medium=outreach&utm_campaign=proveedores'

describe('origenAltaDesdeQuery', () => {
  it('compone source-medium-campaign del link de outreach', () => {
    expect(
      origenAltaDesdeQuery({
        utm_source: 'email',
        utm_medium: 'outreach',
        utm_campaign: 'proveedores',
      }),
    ).toBe('email-outreach-proveedores')
    expect(origenAltaDesdeUrl(URL_OUTREACH)).toBe('email-outreach-proveedores')
  })

  it('acepta origen= como fallback y no exige UTM', () => {
    expect(origenAltaDesdeQuery({ origen: 'email-outreach' })).toBe('email-outreach')
    expect(origenAltaDesdeQuery({ origenAlta: 'Email Outreach' })).toBe('email-outreach')
    expect(origenAltaDesdeQuery({})).toBeNull()
    expect(origenAltaDesdeQuery({ utm_source: '', utm_medium: '  ', utm_campaign: '' })).toBeNull()
  })

  it('toma el primer valor si viene como array y recorta basura', () => {
    expect(
      origenAltaDesdeQuery({
        utm_source: ['Email', 'otro'],
        utm_medium: 'Outreach!',
        utm_campaign: 'Proveedores 2026',
      }),
    ).toBe('email-outreach-proveedores-2026')
    expect(sanitizarOrigenAlta('<script>alert(1)</script>')).toBe('script-alert-1-script')
    expect(sanitizarOrigenAlta('')).toBeNull()
  })

  it('lee URLSearchParams igual que un objeto', () => {
    const params = new URLSearchParams(
      'utm_source=email&utm_medium=outreach&utm_campaign=proveedores',
    )
    expect(origenAltaDesdeQuery(params)).toBe('email-outreach-proveedores')
  })
})

describe('primer toque', () => {
  it('conserva el origen existente y nunca lo pisa', () => {
    expect(resolverOrigenAlta('email-outreach', 'otra-campana')).toBe('email-outreach')
    expect(resolverOrigenAlta('email-outreach', null)).toBe('email-outreach')
    expect(resolverOrigenAlta(null, 'email-outreach-proveedores')).toBe(
      'email-outreach-proveedores',
    )
    expect(resolverOrigenAlta(undefined, undefined)).toBeNull()
    expect(resolverOrigenAlta('  ', 'email-outreach')).toBe('email-outreach')
  })

  it('el parche Prisma solo escribe si la fila está vacía', () => {
    expect(parcheOrigenAlta(null, 'email-outreach-proveedores')).toEqual({
      origenAlta: 'email-outreach-proveedores',
    })
    expect(parcheOrigenAlta('email-outreach', 'otra-campana')).toEqual({})
    expect(parcheOrigenAlta(null, null)).toEqual({})
    expect(parcheOrigenAlta(undefined, '')).toEqual({})
  })
})

describe('cableado del alta', () => {
  it('la página y el action leen UTM y persisten primer toque', () => {
    const pagina = readFileSync(
      resolve(process.cwd(), 'src/app/(sitio)/proveedores/page.tsx'),
      'utf8',
    )
    const action = readFileSync(resolve(process.cwd(), 'src/server/proveedores.ts'), 'utf8')
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/formulario-cuenta-proveedor.tsx'),
      'utf8',
    )
    expect(pagina).toContain('origenAltaDesdeQuery')
    expect(pagina).toContain('searchParams')
    expect(action).toContain('origenAltaDesdeQuery')
    expect(action).toContain('parcheOrigenAlta')
    expect(action).toContain('existente?.origenAlta')
    expect(form).toContain('name="origenAlta"')
  })

  it('la guía documenta el link de outreach con UTM', () => {
    const guia = readFileSync(resolve(process.cwd(), 'docs/guia-de-desarrollo.md'), 'utf8')
    expect(guia).toContain(URL_OUTREACH)
  })
})
