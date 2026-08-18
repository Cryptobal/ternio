/**
 * Markdown mínimo para el blog. Sin dependencias: frontmatter YAML simple
 * y un subconjunto (títulos, listas, enlaces, énfasis). El HTML de salida
 * solo usa etiquetas que este parser emite.
 */

export function escaparHtml(valor: string): string {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function escaparAttr(valor: string): string {
  return escaparHtml(valor)
}

export function esHrefSeguro(href: string): boolean {
  const limpio = href.trim()
  if (limpio.startsWith('/') && !limpio.startsWith('//')) return true
  if (limpio.startsWith('#')) return true
  try {
    const url = new URL(limpio)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function parsearYamlSimple(bloque: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  let claveLista: string | null = null

  for (const lineaCruda of bloque.split(/\r?\n/)) {
    const linea = lineaCruda.replace(/\s+$/, '')
    if (!linea.trim() || linea.trim().startsWith('#')) continue

    const itemLista = linea.match(/^\s+-\s+(.+)$/)
    if (itemLista && claveLista) {
      const actual = data[claveLista]
      const items = Array.isArray(actual) ? actual : []
      items.push(desquotar(itemLista[1] ?? ''))
      data[claveLista] = items
      continue
    }

    const par = linea.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!par) continue
    const clave = par[1] ?? ''
    const resto = (par[2] ?? '').trim()
    if (resto === '') {
      claveLista = clave
      data[clave] = []
      continue
    }
    claveLista = null
    data[clave] = desquotar(resto)
  }

  return data
}

function desquotar(valor: string): string {
  if (
    (valor.startsWith('"') && valor.endsWith('"')) ||
    (valor.startsWith("'") && valor.endsWith("'"))
  ) {
    return valor.slice(1, -1)
  }
  return valor
}

export function separarFrontmatter(raw: string): { data: Record<string, unknown>; cuerpo: string } | null {
  const texto = raw.replace(/^\uFEFF/, '')
  const match = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return null
  return { data: parsearYamlSimple(match[1] ?? ''), cuerpo: match[2] ?? '' }
}

function inline(texto: string): string {
  let t = escaparHtml(texto)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_todo, etiqueta: string, href: string) => {
    if (!esHrefSeguro(href)) return etiqueta
    return `<a href="${escaparAttr(href)}">${etiqueta}</a>`
  })
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return t
}

export function markdownAHtml(md: string): string {
  const lineas = md.replace(/\r\n/g, '\n').split('\n')
  const bloques: string[] = []
  let i = 0

  while (i < lineas.length) {
    const linea = lineas[i] ?? ''
    if (!linea.trim()) {
      i += 1
      continue
    }

    const h2 = linea.match(/^##\s+(.+)$/)
    if (h2) {
      bloques.push(`<h2>${inline(h2[1] ?? '')}</h2>`)
      i += 1
      continue
    }
    const h3 = linea.match(/^###\s+(.+)$/)
    if (h3) {
      bloques.push(`<h3>${inline(h3[1] ?? '')}</h3>`)
      i += 1
      continue
    }

    if (/^\s*[-*]\s+/.test(linea)) {
      const items: string[] = []
      while (i < lineas.length && /^\s*[-*]\s+/.test(lineas[i] ?? '')) {
        items.push(`<li>${inline((lineas[i] ?? '').replace(/^\s*[-*]\s+/, ''))}</li>`)
        i += 1
      }
      bloques.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\s*\d+\.\s+/.test(linea)) {
      const items: string[] = []
      while (i < lineas.length && /^\s*\d+\.\s+/.test(lineas[i] ?? '')) {
        items.push(`<li>${inline((lineas[i] ?? '').replace(/^\s*\d+\.\s+/, ''))}</li>`)
        i += 1
      }
      bloques.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    const parrafo: string[] = []
    while (
      i < lineas.length &&
      (lineas[i] ?? '').trim() &&
      !/^(##|###)\s+/.test(lineas[i] ?? '') &&
      !/^\s*[-*]\s+/.test(lineas[i] ?? '') &&
      !/^\s*\d+\.\s+/.test(lineas[i] ?? '')
    ) {
      parrafo.push((lineas[i] ?? '').trim())
      i += 1
    }
    if (parrafo.length > 0) {
      bloques.push(`<p>${inline(parrafo.join(' '))}</p>`)
    }
  }

  return bloques.join('\n')
}

export function contarPalabrasMarkdown(md: string): number {
  const texto = md
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/[#*_\[\]]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
  return texto.split(/\s+/).filter(Boolean).length
}
