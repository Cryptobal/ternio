import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { OG_IMAGE, URL_OG_PNG, URL_SITIO_CANONICA } from '@/lib/metadata-publico'

const raiz = process.cwd()

function pngIhDR(buf: Buffer) {
  expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe('metadata pública www + PNG', () => {
  it('og:image es https://www.ternio.cl/og.png, no apex ni ruta sin extensión', () => {
    expect(URL_SITIO_CANONICA).toBe('https://www.ternio.cl')
    expect(URL_OG_PNG).toBe('https://www.ternio.cl/og.png')
    expect(OG_IMAGE.url).toBe(URL_OG_PNG)
    expect(OG_IMAGE.secureUrl).toBe(URL_OG_PNG)
    expect(OG_IMAGE.type).toBe('image/png')
    expect(OG_IMAGE.width).toBe(1200)
    expect(OG_IMAGE.height).toBe(630)
    expect(URL_OG_PNG).not.toContain('://ternio.cl/')
    expect(URL_OG_PNG.endsWith('.png')).toBe(true)
  })

  it('el layout y las páginas SEO usan esa imagen', () => {
    const layout = readFileSync(resolve(raiz, 'src/app/layout.tsx'), 'utf8')
    const rubro = readFileSync(resolve(raiz, 'src/app/(seo)/[rubro]/page.tsx'), 'utf8')
    const combo = readFileSync(resolve(raiz, 'src/app/(seo)/[rubro]/[comuna]/page.tsx'), 'utf8')
    expect(layout).toContain('URL_SITIO_CANONICA')
    expect(layout).toContain('OG_IMAGE')
    expect(layout).toContain('URL_OG_PNG')
    expect(layout).toContain('/favicon.ico')
    expect(layout).toContain('/icon.png')
    expect(layout).not.toContain('https://ternio.cl')
    expect(rubro).toContain('images: [OG_IMAGE]')
    expect(combo).toContain('images: [OG_IMAGE]')
  })

  it('ya no hay opengraph-image generado sin extensión', () => {
    expect(existsSync(resolve(raiz, 'src/app/opengraph-image.tsx'))).toBe(false)
  })
})

describe('archivos de icono y OG', () => {
  it('favicon.ico tiene 16, 32 y 48 embebidos como PNG', () => {
    const ico = readFileSync(resolve(raiz, 'src/app/favicon.ico'))
    expect(ico.readUInt16LE(0)).toBe(0)
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBe(3)
    const tamanos = new Set<number>()
    let dir = 6
    for (let i = 0; i < 3; i += 1) {
      const lado = ico.readUInt8(dir)
      const offset = ico.readUInt32LE(dir + 12)
      expect(ico.subarray(offset, offset + 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
        true,
      )
      tamanos.add(lado)
      dir += 16
    }
    expect(tamanos).toEqual(new Set([16, 32, 48]))
    const publico = readFileSync(resolve(raiz, 'public/favicon.ico'))
    expect(publico.equals(ico)).toBe(true)
  })

  it('icon.png es PNG 32×32', () => {
    const png = readFileSync(resolve(raiz, 'src/app/icon.png'))
    expect(pngIhDR(png)).toEqual({ width: 32, height: 32 })
  })

  it('public/og.png es PNG 1200×630', () => {
    const png = readFileSync(resolve(raiz, 'public/og.png'))
    expect(pngIhDR(png)).toEqual({ width: 1200, height: 630 })
  })
})
