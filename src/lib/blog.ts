import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { URL_SITIO_CANONICA } from '@/lib/metadata-publico'
import { contarPalabrasMarkdown, markdownAHtml, separarFrontmatter } from '@/lib/markdown'
import { pathPublicoRubro, RUBROS_VENTA_PUBLICOS } from '@/lib/seo-rutas'

export type FrontmatterBlog = {
  title: string
  description: string
  date: string
  slug: string
  rubro?: string
  keywords: string[]
}

export type PostBlog = FrontmatterBlog & {
  cuerpo: string
  html: string
  path: string
  canonical: string
}

const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FECHA_OK = /^\d{4}-\d{2}-\d{2}$/
const RUBROS = new Set<string>(RUBROS_VENTA_PUBLICOS)

export function dirBlog(raiz = process.cwd()): string {
  return join(raiz, 'content', 'blog')
}

export function pathPublicoPost(slug: string): string {
  return `/blog/${slug}`
}

function comoTexto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined
}

function comoKeywords(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof valor === 'string' && valor.trim()) {
    return valor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export function parsearPost(raw: string, archivo: string): PostBlog | null {
  const separado = separarFrontmatter(raw)
  if (!separado) return null

  const title = comoTexto(separado.data.title)
  const description = comoTexto(separado.data.description)
  const date = comoTexto(separado.data.date)
  const slugArchivo = archivo.replace(/\.mdx?$/, '')
  const slug = comoTexto(separado.data.slug) ?? slugArchivo
  const rubro = comoTexto(separado.data.rubro)
  const keywords = comoKeywords(separado.data.keywords)
  const cuerpo = separado.cuerpo.trim()

  if (!title || !description || !date || !slug || !cuerpo) return null
  if (!FECHA_OK.test(date)) return null
  if (Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) return null
  if (!SLUG_OK.test(slug)) return null
  if (rubro && !RUBROS.has(rubro)) return null

  const path = pathPublicoPost(slug)
  return {
    title,
    description,
    date,
    slug,
    rubro,
    keywords,
    cuerpo,
    html: markdownAHtml(cuerpo),
    path,
    canonical: `${URL_SITIO_CANONICA}${path}`,
  }
}

export function listarPosts(raiz = process.cwd()): PostBlog[] {
  try {
    const dir = dirBlog(raiz)
    const archivos = readdirSync(dir)
      .filter((nombre) => nombre.endsWith('.md') || nombre.endsWith('.mdx'))
      .sort()
    const vistos = new Set<string>()
    const posts: PostBlog[] = []

    for (const archivo of archivos) {
      try {
        const raw = readFileSync(join(dir, archivo), 'utf8')
        const post = parsearPost(raw, archivo)
        if (!post || vistos.has(post.slug)) continue
        vistos.add(post.slug)
        posts.push(post)
      } catch {
        /* archivo malo: se omite */
      }
    }

    return posts.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.slug.localeCompare(b.slug)
    })
  } catch {
    return []
  }
}

export function postPorSlug(slug: string, raiz = process.cwd()): PostBlog | null {
  return listarPosts(raiz).find((post) => post.slug === slug) ?? null
}

export function pathsPublicosBlog(raiz = process.cwd()): string[] {
  try {
    return ['/blog', ...listarPosts(raiz).map((post) => post.path)]
  } catch {
    return ['/blog']
  }
}

export function pathCtaPost(post: Pick<PostBlog, 'rubro'>): string {
  return post.rubro ? `${pathPublicoRubro(post.rubro)}#cotizar` : '/#cotizador'
}

export function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map((parte) => Number(parte))
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ]
  const nombreMes = meses[(mes ?? 0) - 1]
  if (!anio || !dia || !nombreMes) return iso
  return `${dia} de ${nombreMes} de ${anio}`
}

export function palabrasPost(post: Pick<PostBlog, 'cuerpo'>): number {
  return contarPalabrasMarkdown(post.cuerpo)
}
