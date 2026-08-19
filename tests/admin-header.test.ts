import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('admin sin chrome público', () => {
  it('el layout de admin no monta la cabecera ni el pie comerciales', () => {
    const layout = readFileSync(resolve(process.cwd(), 'src/app/admin/layout.tsx'), 'utf8')
    expect(layout).not.toMatch(/CabeceraPublica|PiePublico|MarcoPublico|NavPublica|Soy proveedor/)
    expect(layout).not.toMatch(/from ['"]@\/components\/sitio\/(marco-publico|nav-publica)/)
    expect(layout).not.toMatch(/from ['"]@\/components\/marca/)
  })

  it('el layout raíz no hereda header comercial a /admin', () => {
    const raiz = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    expect(raiz).not.toMatch(/CabeceraPublica|MarcoPublico|Soy proveedor/)
  })
})
