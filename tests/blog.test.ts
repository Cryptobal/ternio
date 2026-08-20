import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  fechaLegible,
  listarPosts,
  parsearPost,
  pathCtaPost,
  pathsPublicosBlog,
  palabrasPost,
} from '@/lib/blog'
import { markdownAHtml, separarFrontmatter } from '@/lib/markdown'
import { RUBROS_VENTA_PUBLICOS } from '@/lib/seo-rutas'
import { copyRubro, faqRubro } from '@/lib/seo-contenido'

const SLUGS_PRIMEROS = [
  'cuanto-cuesta-un-guardia-de-seguridad-en-chile',
  'como-elegir-empresa-de-aseo-industrial',
  'control-de-plagas-casa-o-empresa-que-pedir',
  'mudanza-en-santiago-que-cotizar',
  'contador-para-pyme-f29-y-remuneraciones',
  'gasfiter-de-urgencia-vs-programado',
  'destape-de-urgencia-vs-programado',
  'como-contratar-empresa-de-seguridad-en-chile',
] as const

describe('markdown del blog', () => {
  it('separa frontmatter y renderiza títulos, listas y enlaces', () => {
    const raw = `---
title: Ejemplo
description: Una guía
date: 2026-08-13
slug: ejemplo
rubro: seguridad
keywords:
  - uno
---

Intro con un [enlace](/seguridad).

## Subtítulo

- Ítem **uno**
- Ítem *dos*
`
    const fm = separarFrontmatter(raw)
    expect(fm?.data.title).toBe('Ejemplo')
    expect(fm?.data.keywords).toEqual(['uno'])
    const html = markdownAHtml(fm?.cuerpo ?? '')
    expect(html).toContain('<h2>Subtítulo</h2>')
    expect(html).toContain('<a href="/seguridad">enlace</a>')
    expect(html).toContain('<strong>uno</strong>')
    expect(html).toContain('<em>dos</em>')
    expect(html).not.toContain('<script')
  })

  it('omite un archivo sin título o con fecha mala', () => {
    expect(parsearPost('sin frontmatter', 'x.md')).toBeNull()
    expect(
      parsearPost(
        `---
title: X
description: Y
date: 18-08-2026
slug: x
---

Hola
`,
        'x.md',
      ),
    ).toBeNull()
  })
})

describe('posts publicados', () => {
  const posts = listarPosts()

  it('son 8, más nuevo primero, slugs pedidos', () => {
    expect(posts.map((post) => post.slug)).toEqual([
      'como-contratar-empresa-de-seguridad-en-chile',
      'destape-de-urgencia-vs-programado',
      'gasfiter-de-urgencia-vs-programado',
      'contador-para-pyme-f29-y-remuneraciones',
      'mudanza-en-santiago-que-cotizar',
      'control-de-plagas-casa-o-empresa-que-pedir',
      'como-elegir-empresa-de-aseo-industrial',
      'cuanto-cuesta-un-guardia-de-seguridad-en-chile',
    ])
    expect(posts[0]?.date).toBe('2026-08-20')
    expect(posts.at(-1)?.date).toBe('2026-08-13')
    expect(new Set(posts.map((post) => post.date)).size).toBe(8)
  })

  it('cada post renderiza HTML, metadescripción propia y CTA al rubro', () => {
    const porSlug = new Map(posts.map((post) => [post.slug, post]))
    const destinos: Record<(typeof SLUGS_PRIMEROS)[number], string> = {
      'cuanto-cuesta-un-guardia-de-seguridad-en-chile': '/seguridad#cotizar',
      'como-elegir-empresa-de-aseo-industrial': '/aseo#cotizar',
      'control-de-plagas-casa-o-empresa-que-pedir': '/control-de-plagas#cotizar',
      'mudanza-en-santiago-que-cotizar': '/mudanzas#cotizar',
      'contador-para-pyme-f29-y-remuneraciones': '/contabilidad#cotizar',
      'gasfiter-de-urgencia-vs-programado': '/gasfiteria#cotizar',
      'destape-de-urgencia-vs-programado': '/destape#cotizar',
      'como-contratar-empresa-de-seguridad-en-chile': '/seguridad#cotizar',
    }
    const titles = posts.map((post) => post.title)
    const descriptions = posts.map((post) => post.description)
    expect(new Set(titles).size).toBe(8)
    expect(new Set(descriptions).size).toBe(8)

    for (const slug of SLUGS_PRIMEROS) {
      const post = porSlug.get(slug)
      expect(post).toBeTruthy()
      if (!post) continue
      expect(post.html).toMatch(/<h2>/)
      expect(post.html).toContain(`href="/${post.rubro}`)
      expect(post.canonical).toBe(`https://www.ternio.cl/blog/${slug}`)
      expect(pathCtaPost(post)).toBe(destinos[slug])
      const palabras = palabrasPost(post)
      expect(palabras).toBeGreaterThanOrEqual(700)
      expect(palabras).toBeLessThanOrEqual(1100)
      expect(post.cuerpo).not.toMatch(/tenemos \+1000 empresas|te van a contactar 5 empresas/i)
      expect(post.cuerpo).not.toMatch(/Gard/i)
    }
  })

  it('falla suave si un .md del directorio está roto', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ternio-blog-'))
    try {
      mkdirSync(join(tmp, 'content', 'blog'), { recursive: true })
      writeFileSync(join(tmp, 'content', 'blog', 'malo.md'), '---\nslug: malo\n---\n', 'utf8')
      writeFileSync(
        join(tmp, 'content', 'blog', 'bueno.md'),
        `---
title: Bueno
description: Un post válido de prueba
date: 2026-08-10
slug: bueno
---

Texto del cuerpo.
`,
        'utf8',
      )
      const leidos = listarPosts(tmp)
      expect(leidos.map((post) => post.slug)).toEqual(['bueno'])
      expect(pathsPublicosBlog(tmp)).toEqual(['/blog', '/blog/bueno'])
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('fecha en español de Chile y el pie enlaza el blog', () => {
    expect(fechaLegible('2026-08-13')).toBe('13 de agosto de 2026')
    const marco = readFileSync(resolve(process.cwd(), 'src/components/sitio/marco-publico.tsx'), 'utf8')
    expect(marco).toContain('href="/blog"')
    const articulo = readFileSync(
      resolve(process.cwd(), 'src/app/(sitio)/blog/[slug]/page.tsx'),
      'utf8',
    )
    expect(articulo).toContain("'@type': 'Article'")
    expect(articulo).toContain('generateMetadata')
    expect(articulo).toContain('pathCtaPost')
  })
})

describe('FAQ por rubro', () => {
  it('cada landing VENTA tiene 3–5 preguntas propias', () => {
    const vistos = new Set<string>()
    for (const slug of RUBROS_VENTA_PUBLICOS) {
      const faq = faqRubro(slug)
      expect(faq.length).toBeGreaterThanOrEqual(3)
      expect(faq.length).toBeLessThanOrEqual(5)
      const preguntas = faq.map((item) => item.pregunta)
      expect(new Set(preguntas).size).toBe(preguntas.length)
      const firma = preguntas.join('|')
      expect(vistos.has(firma)).toBe(false)
      vistos.add(firma)
      for (const item of faq) {
        expect(item.respuesta.length).toBeGreaterThan(20)
      }
    }
    const financiero = copyRubro('asesoria-financiera', 'Créditos', null).faq
      .map((item) => `${item.pregunta} ${item.respuesta}`)
      .join(' ')
    const seguros = copyRubro('seguros', 'Seguros', null).faq
      .map((item) => `${item.pregunta} ${item.respuesta}`)
      .join(' ')
    expect(financiero).toMatch(/no es un banco/i)
    expect(seguros).toMatch(/no vende pólizas|no es aseguradora/i)
  })
})
