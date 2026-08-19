/**
 * Helpers de marca pública del proveedor (logo, ficha, URL).
 * Puros: tests sin Prisma ni Blob.
 */

export const DESCRIPCION_MAX = 280
export const LOGO_MAX_BYTES = 1_048_576
const TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/webp'] as const

export type AccesoBlob = 'public' | 'private'

/** Blob listo si hay token RW o store conectado (OIDC en Vercel). */
export function blobConfigurado(
  token = process.env.BLOB_READ_WRITE_TOKEN,
  storeId = process.env.BLOB_STORE_ID,
): boolean {
  return Boolean(token?.trim() || storeId?.trim())
}

/** Debe calzar con el modo del store al crearlo (no se puede cambiar después). */
export function accesoBlobLogo(raw = process.env.BLOB_ACCESS): AccesoBlob {
  return raw?.trim().toLowerCase() === 'private' ? 'private' : 'public'
}

export function esUrlBlobVercel(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host.endsWith('.public.blob.vercel-storage.com') ||
      host.endsWith('.private.blob.vercel-storage.com') ||
      host === 'public.blob.vercel-storage.com' ||
      host === 'private.blob.vercel-storage.com'
    )
  } catch {
    return false
  }
}

export function esLogoBlobPrivado(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.private.blob.vercel-storage.com')
  } catch {
    return false
  }
}

/** URL usable en <img>: blobs privados pasan por proxy autenticado en servidor. */
export function urlLogoVisible(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null
  if (esLogoBlobPrivado(logoUrl)) {
    return `/api/blob-marca?u=${encodeURIComponent(logoUrl)}`
  }
  return logoUrl
}

export function mensajeErrorSubidaLogo(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (msg.includes('Access denied')) {
    return 'El token de Blob no tiene permiso. Revisa que BLOB_READ_WRITE_TOKEN sea del mismo store que BLOB_STORE_ID.'
  }
  if (msg.includes('OIDC is enabled')) {
    return 'Blob está conectado pero OIDC no aplica en este entorno. Agrega un BLOB_READ_WRITE_TOKEN válido del store.'
  }
  if (msg.includes('store does not exist')) {
    return 'No encontramos el Blob store. Reconecta el store al proyecto en Vercel → Storage.'
  }
  if (msg.includes('File is too large')) {
    return 'El archivo es demasiado grande para Blob.'
  }
  if (/access|private|public/i.test(msg)) {
    return 'El modo de acceso no calza con tu Blob store. Si lo creaste privado, agrega BLOB_ACCESS=private en Vercel y redeploy.'
  }

  return 'No pudimos subir el logo. Intenta de nuevo.'
}

export function extensionLogo(tipo: string): string | null {
  switch (tipo) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}

export function validarArchivoLogo(archivo: {
  type: string
  size: number
}): { ok: true } | { ok: false; motivo: string } {
  if (!(TIPOS_LOGO as readonly string[]).includes(archivo.type)) {
    return { ok: false, motivo: 'Solo PNG, JPG o WebP.' }
  }
  if (archivo.size <= 0) return { ok: false, motivo: 'El archivo está vacío.' }
  if (archivo.size > LOGO_MAX_BYTES) {
    return { ok: false, motivo: 'El logo no puede pesar más de 1 MB.' }
  }
  return { ok: true }
}

export function monogramaProveedor(nombre: string): string {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/g, ''))
    .filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) {
    const unica = partes[0]!
    return unica.slice(0, 2).toUpperCase()
  }
  return `${partes[0]![0]!}${partes[1]![0]!}`.toUpperCase()
}

export function pathPublicoEmpresa(slug: string): string {
  return `/empresa/${slug.trim().toLowerCase()}`
}

export function normalizarSitioWeb(
  bruto: string,
): { ok: true; url: string | null } | { ok: false; motivo: string } {
  const limpio = bruto.trim()
  if (!limpio) return { ok: true, url: null }

  let candidato = limpio
  if (!/^https?:\/\//i.test(candidato)) {
    candidato = `https://${candidato}`
  }

  try {
    const url = new URL(candidato)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, motivo: 'El sitio web debe ser http o https.' }
    }
    if (!url.hostname.includes('.')) {
      return { ok: false, motivo: 'Revisa el sitio web.' }
    }
    return { ok: true, url: url.toString() }
  } catch {
    return { ok: false, motivo: 'Revisa el sitio web.' }
  }
}

export function normalizarDescripcion(
  bruto: string,
): { ok: true; texto: string | null } | { ok: false; motivo: string } {
  const limpio = bruto.trim().replace(/\s+/g, ' ')
  if (!limpio) return { ok: true, texto: null }
  if (limpio.length > DESCRIPCION_MAX) {
    return { ok: false, motivo: `La descripción no puede pasar de ${DESCRIPCION_MAX} caracteres.` }
  }
  return { ok: true, texto: limpio }
}
