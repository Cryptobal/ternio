import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('iconos de audiencia', () => {
  it('van rellenos a color, no en currentColor', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/iconos-audiencia.tsx'), 'utf8')
    expect(src).toContain('fill="#FFAB1A"')
    expect(src).toContain('fill="#60A5FA"')
    expect(src).toContain('fill="#2563EB"')
    expect(src).not.toContain('currentColor')
    expect(src).not.toContain('stroke="currentColor"')
  })

  it('el cotizador y el catálogo los reutilizan', () => {
    const selector = readFileSync(
      resolve(process.cwd(), 'src/components/selector-cotizacion.tsx'),
      'utf8',
    )
    const catalogo = readFileSync(
      resolve(process.cwd(), 'src/components/sitio/catalogo-home.tsx'),
      'utf8',
    )
    expect(selector).toContain('GlifoAudiencia')
    expect(selector).not.toContain('currentColor')
    expect(catalogo).toContain('IconoCasa')
    expect(catalogo).toContain('IconoEmpresa')
  })
})
