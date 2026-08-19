import { describe, expect, it } from 'vitest'

import { resolverTemaInicial, esTema, colorTemaMeta, snippetTemaSinDestello } from '@/lib/tema'

describe('resolverTemaInicial', () => {
  it('usa lo guardado cuando es dia o noche', () => {
    expect(resolverTemaInicial('dia', true)).toBe('dia')
    expect(resolverTemaInicial('noche', false)).toBe('noche')
    expect(resolverTemaInicial('dia')).toBe('dia')
    expect(resolverTemaInicial('noche')).toBe('noche')
  })

  it('sin guardado válido abre en día aunque el sistema prefiera oscuro', () => {
    expect(resolverTemaInicial(null, true)).toBe('dia')
    expect(resolverTemaInicial(undefined, false)).toBe('dia')
    expect(resolverTemaInicial('otro', true)).toBe('dia')
  })

  it('el snippet no consulta prefers-color-scheme', () => {
    const snippet = snippetTemaSinDestello()
    expect(snippet).not.toMatch(/prefers-color-scheme/)
    expect(snippet).toMatch(/'dia'/)
  })

  it('esTema y colorTemaMeta', () => {
    expect(esTema('dia')).toBe(true)
    expect(esTema('oscuro')).toBe(false)
    expect(colorTemaMeta('dia')).toBe('#f1f4f8')
    expect(colorTemaMeta('noche')).toBe('#0a1522')
  })
})
