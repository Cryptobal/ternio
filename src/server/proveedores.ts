'use server'

import { headers } from 'next/headers'
import { EstadoProveedor } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'
import { type SolicitudEsperaProveedor, validarListaEspera } from '@/lib/lista-espera'
import { normalizarRut } from '@/lib/rut'
import { normalizarTelefonoE164 } from '@/lib/telefono'
import type { EstadoFormulario } from '@/server/leads'

async function ipDelCliente(): Promise<string> {
  const cabeceras = await headers()
  const reenviada = cabeceras.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || cabeceras.get('x-real-ip') || 'desconocida'
}

/**
 * Inscribe a un proveedor en la lista de espera.
 * Crea o actualiza un Proveedor en PENDIENTE. No abre el marketplace.
 */
export async function inscribirListaEsperaAction(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (String(formData.get('sitio_web') ?? '').trim() !== '') {
    return {
      ok: true,
      mensaje: 'Te avisamos cuando se abra el onboarding.',
    }
  }

  const ip = await ipDelCliente()
  const limite = consumirRateLimit(`lista-espera:${ip}`, 5, 10 * 60_000)
  if (!limite.permitido) {
    return { ok: false, mensaje: 'Ya recibimos tu solicitud. Gracias.' }
  }

  const validacion = validarListaEspera({
    nombreEmpresa: formData.get('nombreEmpresa'),
    rut: formData.get('rut'),
    telefono: formData.get('telefono'),
    email: formData.get('email'),
    rubros: formData.getAll('rubros'),
    region: formData.get('region'),
    provincia: formData.get('provincia'),
    comunas: formData.getAll('comunas'),
  })

  if (!validacion.ok) {
    return { ok: false, mensaje: 'Revisa los datos marcados.', errores: validacion.errores }
  }

  const { nombreEmpresa, rubros, region, provincia, comunas, email } = validacion.datos
  const rutNormalizado = normalizarRut(validacion.datos.rut)
  const telefonoE164 = normalizarTelefonoE164(validacion.datos.telefono)
  if (!rutNormalizado || !telefonoE164) {
    return { ok: false, mensaje: 'Revisa el RUT y el celular.' }
  }

  const rubrosActivos = await prisma.rubro.findMany({
    where: { slug: { in: rubros }, activo: true },
    select: { slug: true },
  })
  const slugsRubro = rubrosActivos.map((fila) => fila.slug)
  if (slugsRubro.length === 0) {
    return { ok: false, errores: { rubros: 'Elige al menos un rubro vigente.' } }
  }

  const comunasDb = await prisma.comuna.findMany({
    where: { slug: { in: comunas }, activa: true },
    select: { id: true, slug: true },
  })
  if (comunasDb.length === 0) {
    return { ok: false, errores: { comunas: 'Elige al menos una comuna vigente.' } }
  }

  const solicitudEspera: SolicitudEsperaProveedor = {
    rubros: slugsRubro,
    region,
    provincia,
    comunas: comunasDb.map((fila) => fila.slug),
  }

  const existente = await prisma.proveedor.findUnique({
    where: { rutNormalizado },
    select: { id: true, estado: true, slug: true },
  })

  if (
    existente &&
    (existente.estado === EstadoProveedor.APROBADO ||
      existente.estado === EstadoProveedor.NO_RECLAMADO ||
      existente.estado === EstadoProveedor.SUSPENDIDO)
  ) {
    return {
      ok: true,
      mensaje: 'Ya tenemos tu empresa registrada. Te avisamos cuando se abra el onboarding.',
    }
  }

  const cuerpoRut = rutNormalizado.slice(0, -2)
  const slug = existente?.slug ?? `espera-${cuerpoRut}`

  await prisma.proveedor.upsert({
    where: { rutNormalizado },
    create: {
      slug,
      nombre: nombreEmpresa,
      razonSocial: nombreEmpresa,
      rutNormalizado,
      email,
      telefonoE164,
      estado: EstadoProveedor.PENDIENTE,
      comunaBaseId: comunasDb[0]?.id ?? null,
      solicitudEspera,
      vistoAt: null,
    },
    update: {
      nombre: nombreEmpresa,
      razonSocial: nombreEmpresa,
      email,
      telefonoE164,
      estado: EstadoProveedor.PENDIENTE,
      comunaBaseId: comunasDb[0]?.id ?? null,
      solicitudEspera,
      vistoAt: null,
    },
  })

  return {
    ok: true,
    mensaje: 'Te avisamos cuando se abra el onboarding.',
  }
}
