import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { idContenedorGtm, snippetGtm, urlNoscriptGtm } from '@/lib/gtm'

const CONTENEDOR = 'GTM-K3F8GGHV'

describe('idContenedorGtm', () => {
  const original = process.env.NEXT_PUBLIC_GTM_ID

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_GTM_ID
    else process.env.NEXT_PUBLIC_GTM_ID = original
  })

  it('usa el contenedor de producción si el env no está definido', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID
    expect(idContenedorGtm()).toBe(CONTENEDOR)
  })

  it('permite sobreescribir el contenedor', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123'
    expect(idContenedorGtm()).toBe('GTM-TEST123')
  })

  it('no inyecta nada si el env está vacío (fail-closed)', () => {
    process.env.NEXT_PUBLIC_GTM_ID = '   '
    expect(idContenedorGtm()).toBeNull()
  })

  it('no inyecta un id que no es de GTM', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'G-ABCDEFG'
    expect(idContenedorGtm()).toBeNull()
  })
})

describe('snippets oficiales', () => {
  it('el script carga gtm.js con el id del contenedor, no gtag.js', () => {
    const snippet = snippetGtm(CONTENEDOR)
    expect(snippet).toContain("w[l].push({'gtm.start':")
    expect(snippet).toContain('https://www.googletagmanager.com/gtm.js?id=')
    expect(snippet).toContain(`'${CONTENEDOR}'`)
    expect(snippet).not.toContain('gtag.js')
    expect(snippet).not.toContain('G-')
  })

  it('el noscript apunta al iframe oficial del contenedor', () => {
    expect(urlNoscriptGtm(CONTENEDOR)).toBe(
      `https://www.googletagmanager.com/ns.html?id=${CONTENEDOR}`,
    )
  })
})

describe('instalación en el layout raíz', () => {
  const raiz = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf8')
  const componente = readFileSync(resolve(process.cwd(), 'src/components/gtm.tsx'), 'utf8')

  it('el layout monta script y noscript una sola vez, sin gtag.js', () => {
    expect(raiz.match(/ScriptGtm/g)).toHaveLength(2)
    expect(raiz.match(/NoscriptGtm/g)).toHaveLength(2)
    expect(raiz).not.toMatch(/gtag\.js|googletagmanager\.com\/gtag/)
  })

  it('el componente usa next/script y el iframe noscript oficial', () => {
    expect(componente).toMatch(/from ['"]next\/script['"]/)
    expect(componente).toMatch(/strategy="beforeInteractive"/)
    expect(componente).toMatch(/<noscript>/)
    expect(componente).toMatch(/urlNoscriptGtm/)
    expect(componente).not.toMatch(/gtag\.js|G-[A-Z0-9]+/)
  })
})
