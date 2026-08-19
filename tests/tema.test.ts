import { describe, expect, it } from 'vitest'

import { resolverTemaInicial, esTema, colorTemaMeta } from '@/lib/tema'

describe('resolverTemaInicial', () => {
  it('usa lo guardado cuando es dia o noche', () => {
    expect(resolverTemaInicial('dia', true)).toBe('dia')
    expect(resolverTemaInicial('noche', false)).toBe('noche')
  })

  it('cae a la preferencia del sistema si no hay guardado', () => {
    expect(resolverTemaInicial(null, true)).toBe('noche')
    expect(resolverTemaInicial(undefined, false)).toBe('dia')
    expect(resolverTemaInicial('otro', true)).toBe('noche')
  })

  it('esTema y colorTemaMeta', () => {
    expect(esTema('dia')).toBe(true)
    expect(esTema('oscuro')).toBe(false)
    expect(colorTemaMeta('dia')).toBe('#f1f4f8')
    expect(colorTemaMeta('noche')).toBe('#0a1522')
  })
})
