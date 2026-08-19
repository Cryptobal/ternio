import 'server-only'

import { del, put } from '@vercel/blob'

import {
  blobConfigurado,
  extensionLogo,
  validarArchivoLogo,
} from '@/lib/logo-proveedor'

export async function subirLogoProveedor(args: {
  proveedorId: string
  archivo: File
  token?: string
}): Promise<{ ok: true; url: string } | { ok: false; motivo: string }> {
  const token = args.token ?? process.env.BLOB_READ_WRITE_TOKEN
  if (!blobConfigurado(token)) {
    return { ok: false, motivo: 'La subida de logos no está configurada todavía.' }
  }

  const validacion = validarArchivoLogo(args.archivo)
  if (!validacion.ok) return validacion

  const ext = extensionLogo(args.archivo.type)
  if (!ext) return { ok: false, motivo: 'Solo PNG, JPG o WebP.' }

  const pathname = `proveedores/${args.proveedorId}/logo-${Date.now()}.${ext}`
  try {
    const blob = await put(pathname, args.archivo, {
      access: 'public',
      token: token!.trim(),
      contentType: args.archivo.type,
      addRandomSuffix: true,
    })
    return { ok: true, url: blob.url }
  } catch (error) {
    console.error('[blob] subir logo', error)
    return { ok: false, motivo: 'No pudimos subir el logo. Intenta de nuevo.' }
  }
}

export function esUrlBlobVercel(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host.endsWith('.public.blob.vercel-storage.com') || host === 'public.blob.vercel-storage.com'
  } catch {
    return false
  }
}

export async function borrarBlobSiEsNuestro(
  url: string | null | undefined,
  token = process.env.BLOB_READ_WRITE_TOKEN,
): Promise<void> {
  if (!url || !esUrlBlobVercel(url) || !blobConfigurado(token)) return
  try {
    await del(url, { token: token!.trim() })
  } catch (error) {
    console.error('[blob] borrar logo', error)
  }
}
