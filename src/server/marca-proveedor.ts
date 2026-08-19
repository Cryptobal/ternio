'use server'

import { revalidatePath } from 'next/cache'

import { borrarBlobSiEsNuestro, subirLogoProveedor } from '@/lib/blob'
import { normalizarDescripcion, normalizarSitioWeb, pathPublicoEmpresa } from '@/lib/logo-proveedor'
import { prisma } from '@/lib/prisma'
import { requerirProveedor } from '@/server/sesion'

export type ResultadoMarcaPanel = { ok: boolean; mensaje: string }

async function proveedorDeSesion() {
  const sesion = await requerirProveedor()
  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId: sesion.user.id },
    select: { id: true, slug: true, logoUrl: true },
  })
  return proveedor
}

function revalidarMarca(slug: string) {
  revalidatePath('/panel')
  revalidatePath('/admin/proveedores')
  revalidatePath(pathPublicoEmpresa(slug))
}

export async function actualizarFichaMarcaAction(
  _previo: ResultadoMarcaPanel,
  formData: FormData,
): Promise<ResultadoMarcaPanel> {
  const proveedor = await proveedorDeSesion()
  if (!proveedor) return { ok: false, mensaje: 'No encontramos tu cuenta.' }

  const desc = normalizarDescripcion(String(formData.get('descripcion') ?? ''))
  if (!desc.ok) return { ok: false, mensaje: desc.motivo }

  const web = normalizarSitioWeb(String(formData.get('sitioWeb') ?? ''))
  if (!web.ok) return { ok: false, mensaje: web.motivo }

  await prisma.proveedor.update({
    where: { id: proveedor.id },
    data: {
      descripcion: desc.texto,
      sitioWeb: web.url,
    },
  })

  revalidarMarca(proveedor.slug)
  return { ok: true, mensaje: 'Marca actualizada.' }
}

export async function subirLogoMarcaAction(
  _previo: ResultadoMarcaPanel,
  formData: FormData,
): Promise<ResultadoMarcaPanel> {
  const proveedor = await proveedorDeSesion()
  if (!proveedor) return { ok: false, mensaje: 'No encontramos tu cuenta.' }

  const archivo = formData.get('logo')
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: 'Elige un archivo de imagen.' }
  }

  const subida = await subirLogoProveedor({ proveedorId: proveedor.id, archivo })
  if (!subida.ok) return { ok: false, mensaje: subida.motivo }

  const anterior = proveedor.logoUrl
  await prisma.proveedor.update({
    where: { id: proveedor.id },
    data: { logoUrl: subida.url },
  })
  await borrarBlobSiEsNuestro(anterior)

  revalidarMarca(proveedor.slug)
  return { ok: true, mensaje: 'Logo actualizado.' }
}

export async function quitarLogoMarcaAction(
  previo: ResultadoMarcaPanel,
  formData: FormData,
): Promise<ResultadoMarcaPanel> {
  void previo
  void formData
  const proveedor = await proveedorDeSesion()
  if (!proveedor) return { ok: false, mensaje: 'No encontramos tu cuenta.' }
  if (!proveedor.logoUrl) return { ok: true, mensaje: 'No había logo.' }

  const anterior = proveedor.logoUrl
  await prisma.proveedor.update({
    where: { id: proveedor.id },
    data: { logoUrl: null },
  })
  await borrarBlobSiEsNuestro(anterior)

  revalidarMarca(proveedor.slug)
  return { ok: true, mensaje: 'Logo quitado.' }
}
