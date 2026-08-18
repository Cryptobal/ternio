'use server'

import { revalidatePath } from 'next/cache'

import { Prisma } from '@prisma/client'

import { rutaAdmin } from '@/lib/admin-ruta'
import { parsearCamposEscritos, parsearDatosRubro } from '@/lib/admin-rubros'
import { prisma } from '@/lib/prisma'
import { pathPublicoRubro } from '@/lib/seo-rutas'
import { requerirAdmin } from '@/server/sesion'

export type ResultadoRubroAdmin = {
  ok: boolean
  mensaje: string
  errores?: Record<string, string>
  id?: string
}

export async function crearRubroAction(
  _previo: ResultadoRubroAdmin,
  formData: FormData,
): Promise<ResultadoRubroAdmin> {
  await requerirAdmin()

  const parseo = parsearDatosRubro({
    nombre: formData.get('nombre'),
    nombrePlural: formData.get('nombrePlural'),
    slug: formData.get('slug'),
    descripcion: formData.get('descripcion'),
    modo: formData.get('modo'),
    activo: 'true',
    orden: formData.get('orden'),
    audiencias: formData.getAll('audiencias'),
    precioExclusivoClp: formData.get('precioExclusivoClp'),
    precioCompartidoClp: formData.get('precioCompartidoClp'),
    precioExclusivoHogarClp: formData.get('precioExclusivoHogarClp'),
    precioCompartidoHogarClp: formData.get('precioCompartidoHogarClp'),
  })
  if (!parseo.ok) {
    return { ok: false, mensaje: parseo.motivo, errores: parseo.errores }
  }

  const campos = parsearCamposEscritos(formData.get('camposFormulario'))
  if (!campos.ok) {
    return { ok: false, mensaje: campos.motivo, errores: { camposFormulario: campos.motivo } }
  }

  const ocupado = await prisma.rubro.findUnique({
    where: { slug: parseo.datos.slug },
    select: { id: true },
  })
  if (ocupado) {
    return { ok: false, mensaje: 'Ya existe un rubro con ese slug.', errores: { slug: 'Ese slug ya está en uso.' } }
  }

  const creado = await prisma.rubro.create({
    data: {
      slug: parseo.datos.slug,
      nombre: parseo.datos.nombre,
      nombrePlural: parseo.datos.nombrePlural,
      descripcion: parseo.datos.descripcion,
      modo: parseo.datos.modo,
      activo: true,
      orden: parseo.datos.orden,
      audiencias: parseo.datos.audiencias,
      precioExclusivoClp: parseo.datos.precioExclusivoClp,
      precioCompartidoClp: parseo.datos.precioCompartidoClp,
      precioExclusivoHogarClp: parseo.datos.precioExclusivoHogarClp,
      precioCompartidoHogarClp: parseo.datos.precioCompartidoHogarClp,
      camposFormulario: campos.campos as Prisma.InputJsonValue,
    },
    select: { id: true, slug: true },
  })

  revalidatePath(rutaAdmin('rubros'))
  revalidatePath('/')
  revalidatePath('/proveedores')
  revalidatePath(pathPublicoRubro(creado.slug))
  return { ok: true, mensaje: 'Rubro creado.', id: creado.id }
}

export async function editarRubroAction(
  _previo: ResultadoRubroAdmin,
  formData: FormData,
): Promise<ResultadoRubroAdmin> {
  await requerirAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, mensaje: 'Falta el rubro.' }

  const existente = await prisma.rubro.findUnique({
    where: { id },
    select: { id: true, slug: true },
  })
  if (!existente) return { ok: false, mensaje: 'No encontramos ese rubro.' }

  const parseo = parsearDatosRubro({
    nombre: formData.get('nombre'),
    nombrePlural: formData.get('nombrePlural'),
    slug: existente.slug,
    descripcion: formData.get('descripcion'),
    modo: formData.get('modo'),
    activo: formData.get('activo') ?? 'false',
    orden: formData.get('orden'),
    audiencias: formData.getAll('audiencias'),
    precioExclusivoClp: formData.get('precioExclusivoClp'),
    precioCompartidoClp: formData.get('precioCompartidoClp'),
    precioExclusivoHogarClp: formData.get('precioExclusivoHogarClp'),
    precioCompartidoHogarClp: formData.get('precioCompartidoHogarClp'),
  })
  if (!parseo.ok) {
    return { ok: false, mensaje: parseo.motivo, errores: parseo.errores }
  }

  const campos = parsearCamposEscritos(formData.get('camposFormulario'))
  if (!campos.ok) {
    return { ok: false, mensaje: campos.motivo, errores: { camposFormulario: campos.motivo } }
  }

  await prisma.rubro.update({
    where: { id },
    data: {
      nombre: parseo.datos.nombre,
      nombrePlural: parseo.datos.nombrePlural,
      descripcion: parseo.datos.descripcion,
      modo: parseo.datos.modo,
      activo: parseo.datos.activo,
      orden: parseo.datos.orden,
      audiencias: parseo.datos.audiencias,
      precioExclusivoClp: parseo.datos.precioExclusivoClp,
      precioCompartidoClp: parseo.datos.precioCompartidoClp,
      precioExclusivoHogarClp: parseo.datos.precioExclusivoHogarClp,
      precioCompartidoHogarClp: parseo.datos.precioCompartidoHogarClp,
      camposFormulario: campos.campos as Prisma.InputJsonValue,
    },
  })

  revalidatePath(rutaAdmin('rubros'))
  revalidatePath(rutaAdmin(`rubros/${id}`))
  revalidatePath('/')
  revalidatePath('/proveedores')
  revalidatePath(pathPublicoRubro(existente.slug))
  return { ok: true, mensaje: 'Rubro actualizado.', id }
}

export async function desactivarRubroAction(
  _previo: ResultadoRubroAdmin,
  formData: FormData,
): Promise<ResultadoRubroAdmin> {
  await requerirAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, mensaje: 'Falta el rubro.' }

  const existente = await prisma.rubro.findUnique({
    where: { id },
    select: { id: true, slug: true },
  })
  if (!existente) return { ok: false, mensaje: 'No encontramos ese rubro.' }

  await prisma.rubro.update({
    where: { id },
    data: { activo: false },
  })

  revalidatePath(rutaAdmin('rubros'))
  revalidatePath(rutaAdmin(`rubros/${id}`))
  revalidatePath('/')
  revalidatePath('/proveedores')
  revalidatePath(pathPublicoRubro(existente.slug))
  return { ok: true, mensaje: 'Rubro desactivado. No se borró.', id }
}
