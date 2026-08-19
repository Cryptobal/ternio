import 'server-only'

import { del, put } from '@vercel/blob'

import {
  accesoBlobLogo,
  blobConfigurado,
  esUrlBlobVercel,
  extensionLogo,
  mensajeErrorSubidaLogo,
  validarArchivoLogo,
} from '@/lib/logo-proveedor'

export { esUrlBlobVercel, mensajeErrorSubidaLogo }

export async function subirLogoProveedor(args: {
  proveedorId: string
  archivo: File
}): Promise<{ ok: true; url: string } | { ok: false; motivo: string }> {
  if (!blobConfigurado()) {
    return { ok: false, motivo: 'La subida de logos no está configurada todavía.' }
  }

  const validacion = validarArchivoLogo(args.archivo)
  if (!validacion.ok) return validacion

  const ext = extensionLogo(args.archivo.type)
  if (!ext) return { ok: false, motivo: 'Solo PNG, JPG o WebP.' }

  const pathname = `proveedores/${args.proveedorId}/logo-${Date.now()}.${ext}`
  try {
    const blob = await put(pathname, args.archivo, {
      access: accesoBlobLogo(),
      contentType: args.archivo.type,
      addRandomSuffix: true,
    })
    return { ok: true, url: blob.url }
  } catch (error) {
    console.error('[blob] subir logo', error)
    return { ok: false, motivo: mensajeErrorSubidaLogo(error) }
  }
}

export async function borrarBlobSiEsNuestro(url: string | null | undefined): Promise<void> {
  if (!url || !esUrlBlobVercel(url) || !blobConfigurado()) return
  try {
    await del(url)
  } catch (error) {
    console.error('[blob] borrar logo', error)
  }
}
