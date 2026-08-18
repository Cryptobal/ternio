/**
 * Rasteriza el mark de `src/app/icon.svg` (mismas geometría y colores)
 * a favicon.ico, icon.png y public/og.png. No inventa otra marca.
 *
 * Usa sharp (dependencia transitiva de Next). No agregar deps nuevas.
 */
import { createRequire } from 'node:module'
import { Buffer } from 'node:buffer'
import { readdirSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function cargarSharp() {
  const require = createRequire(import.meta.url)
  try {
    return require('sharp')
  } catch {
    const pnpm = path.join(raiz, 'node_modules/.pnpm')
    const carpeta = readdirSync(pnpm).find((nombre) => nombre.startsWith('sharp@'))
    if (carpeta) return require(path.join(pnpm, carpeta, 'node_modules/sharp'))
    throw new Error('No se encontró sharp. Corre pnpm install.')
  }
}

const sharp = cargarSharp()

const FONDO = '#0E1B2C'
const NARANJO = '#FFAB1A'
const BLANCO = '#FFFFFF'
const TINTA_SUAVE = '#F1F4F8'

/** Barras del mark: mismas coords que icon.svg (viewBox 32×32). */
const BARRAS = `
  <rect x="2.5" y="13" width="7.5" height="16.5" rx="2.6" fill="${BLANCO}"/>
  <rect x="12.2" y="4.5" width="7.5" height="25" rx="2.6" fill="${NARANJO}"/>
  <rect x="22" y="18.5" width="7.5" height="11" rx="2.6" fill="${BLANCO}"/>
`

function svgIcono(px) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="${FONDO}"/>
  ${BARRAS}
</svg>`)
}

function svgOg() {
  // Lockup a la izquierda, como opengraph-image.tsx: padding 80×88, mark 72px,
  // “ternio” 72/800, tagline 34. Inter Bold es el sans del entorno (peso 700).
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${FONDO}"/>
  <g transform="translate(88 244)">
    <svg width="72" height="72" viewBox="0 0 32 32" fill="none">${BARRAS}</svg>
    <text x="94" y="58" fill="${BLANCO}" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="-2.88">ternio</text>
  </g>
  <text x="88" y="390" fill="${TINTA_SUAVE}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600" letter-spacing="-0.68">Cotiza servicios para tu empresa · Chile</text>
</svg>`)
}

function empaquetarIco(pngs) {
  const count = pngs.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  const entries = []
  let offset = 6 + 16 * count
  const bodies = []

  for (const { width, height, png } of pngs) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(width >= 256 ? 0 : width, 0)
    entry.writeUInt8(height >= 256 ? 0 : height, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    bodies.push(png)
    offset += png.length
  }

  return Buffer.concat([header, ...entries, ...bodies])
}

async function raster(svg, width, height) {
  return sharp(svg, { density: 144 })
    .resize(width, height, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function main() {
  const markRepo = await readFile(path.join(raiz, 'src/app/icon.svg'), 'utf8')
  if (!markRepo.includes(FONDO) || !markRepo.includes(NARANJO)) {
    throw new Error('icon.svg no tiene los colores del mark (#0E1B2C / #FFAB1A).')
  }
  if (!markRepo.includes('x="2.5"') || !markRepo.includes('x="12.2"') || !markRepo.includes('x="22"')) {
    throw new Error('icon.svg cambió de geometría; actualiza scripts/generar-iconos.mjs.')
  }

  const png16 = await raster(svgIcono(16), 16, 16)
  const png32 = await raster(svgIcono(32), 32, 32)
  const png48 = await raster(svgIcono(48), 48, 48)
  const ico = empaquetarIco([
    { width: 16, height: 16, png: png16 },
    { width: 32, height: 32, png: png32 },
    { width: 48, height: 48, png: png48 },
  ])
  const og = await raster(svgOg(), 1200, 630)

  await mkdir(path.join(raiz, 'public'), { recursive: true })
  // El ICO vive en public/: app/favicon.ico lo intercepta Next y en 15.1
  // responde 500. public/favicon.ico es GET /favicon.ico = 200 image/x-icon.
  await writeFile(path.join(raiz, 'public/favicon.ico'), ico)
  await writeFile(path.join(raiz, 'src/app/icon.png'), png32)
  await writeFile(path.join(raiz, 'public/og.png'), og)

  const metaOg = await sharp(og).metadata()
  if (metaOg.width !== 1200 || metaOg.height !== 630 || metaOg.format !== 'png') {
    throw new Error(`og.png inválido: ${JSON.stringify(metaOg)}`)
  }

  console.log('OK public/favicon.ico (16/32/48), icon.png 32×32, public/og.png 1200×630')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
