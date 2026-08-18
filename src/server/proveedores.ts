'use server'

import { headers } from 'next/headers'
import { EstadoProveedor, RolUsuario } from '@prisma/client'

import { expandirCobertura, type SnapshotCoberturaProveedor } from '@/lib/cobertura'
import { validarCuentaProveedor } from '@/lib/cuenta-proveedor'
import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'
import { normalizarRut } from '@/lib/rut'
import { normalizarTelefonoE164 } from '@/lib/telefono'
import { enviarOtpAUsuario } from '@/server/otp'

export type EstadoCuentaProveedor = {
  ok: boolean
  mensaje?: string
  errores?: Record<string, string>
  requiereOtp?: boolean
  telefono?: string
  telefonoEnmascarado?: string
}

async function ipDelCliente(): Promise<string> {
  const cabeceras = await headers()
  const reenviada = cabeceras.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || cabeceras.get('x-real-ip') || 'desconocida'
}

function slugProveedor(rutNormalizado: string): string {
  return `prov-${rutNormalizado.slice(0, -2)}`
}

/**
 * Crea User (PROVEEDOR) + Proveedor, persiste cobertura y envía OTP.
 * No abre el marketplace.
 */
export async function crearCuentaProveedorAction(
  _estadoPrevio: EstadoCuentaProveedor,
  formData: FormData,
): Promise<EstadoCuentaProveedor> {
  if (String(formData.get('sitio_web') ?? '').trim() !== '') {
    return { ok: true, mensaje: 'Te enviamos un código.' }
  }

  const ip = await ipDelCliente()
  const limite = consumirRateLimit(`cuenta-proveedor:${ip}`, 5, 10 * 60_000)
  if (!limite.permitido) {
    return { ok: false, mensaje: 'Ya recibimos tu solicitud. Espera un rato y reintenta.' }
  }

  const validacion = validarCuentaProveedor({
    nombreEmpresa: formData.get('nombreEmpresa'),
    rut: formData.get('rut'),
    telefono: formData.get('telefono'),
    email: formData.get('email'),
    rubros: formData.getAll('rubros'),
    modoCobertura: formData.get('modoCobertura'),
    regiones: formData.getAll('regiones'),
    provincias: formData.getAll('provincias'),
    comunas: formData.getAll('comunas'),
  })

  if (!validacion.ok) {
    return { ok: false, mensaje: 'Revisa los datos marcados.', errores: validacion.errores }
  }

  const { nombreEmpresa, rubros, cobertura, email } = validacion.datos
  const rutNormalizado = normalizarRut(validacion.datos.rut)
  const telefonoE164 = normalizarTelefonoE164(validacion.datos.telefono)
  if (!rutNormalizado || !telefonoE164) {
    return { ok: false, mensaje: 'Revisa el RUT y el celular.' }
  }

  const telefonoDeComprador = await prisma.user.findFirst({
    where: { telefonoE164Verificado: telefonoE164, rol: RolUsuario.COMPRADOR },
    select: { id: true },
  })
  if (telefonoDeComprador) {
    return {
      ok: false,
      mensaje: 'Este celular ya tiene una cuenta de cotizaciones. Usa otro o entra como comprador.',
    }
  }

  const rubrosActivos = await prisma.rubro.findMany({
    where: { slug: { in: rubros }, activo: true },
    select: { id: true, slug: true },
  })
  if (rubrosActivos.length === 0) {
    return { ok: false, errores: { rubros: 'Elige al menos un rubro vigente.' } }
  }

  const comunasCatalogo = await prisma.comuna.findMany({
    where: { activa: true },
    select: { id: true, slug: true, nombre: true, region: true, provincia: true },
  })
  const expansion = expandirCobertura(comunasCatalogo, cobertura)
  const comunasExpandidas = expansion.nacional
    ? []
    : comunasCatalogo.filter((fila) => expansion.slugs.includes(fila.slug))

  if (!expansion.nacional && comunasExpandidas.length === 0) {
    return { ok: false, errores: { cobertura: 'No encontramos comunas vigentes para esa cobertura.' } }
  }

  const snapshot: SnapshotCoberturaProveedor = {
    ...cobertura,
    rubros: rubrosActivos.map((fila) => fila.slug),
  }

  const existente = await prisma.proveedor.findUnique({
    where: { rutNormalizado },
    select: {
      id: true,
      slug: true,
      estado: true,
      usuarioId: true,
      usuario: { select: { id: true, rol: true, telefonoE164Verificado: true } },
    },
  })

  if (
    existente?.usuario &&
    existente.usuario.rol === RolUsuario.PROVEEDOR &&
    existente.usuario.telefonoE164Verificado &&
    existente.usuario.telefonoE164Verificado !== telefonoE164
  ) {
    return {
      ok: false,
      mensaje: 'Ya hay una cuenta con ese RUT. Entra con el celular que usaste al registrarte.',
    }
  }

  const usuarioExistentePorTelefono = await prisma.user.findFirst({
    where: { telefonoE164Verificado: telefonoE164, rol: RolUsuario.PROVEEDOR },
  })

  const emailOcupado = await prisma.user.findUnique({
    where: { email },
    select: { id: true, rol: true },
  })

  let usuarioId = existente?.usuarioId ?? usuarioExistentePorTelefono?.id ?? null

  if (!usuarioId) {
    const emailLibre = !emailOcupado || emailOcupado.rol === RolUsuario.PROVEEDOR
    const creado = await prisma.user.create({
      data: {
        name: nombreEmpresa,
        email: emailLibre && !emailOcupado ? email : undefined,
        rol: RolUsuario.PROVEEDOR,
      },
    })
    usuarioId = creado.id
  } else {
    await prisma.user.update({
      where: { id: usuarioId },
      data: {
        name: nombreEmpresa,
        rol: RolUsuario.PROVEEDOR,
        email: !emailOcupado || emailOcupado.id === usuarioId ? email : undefined,
      },
    })
  }

  const slug = existente?.slug ?? slugProveedor(rutNormalizado)
  const comunaBaseId = expansion.nacional ? null : (comunasExpandidas[0]?.id ?? null)

  const proveedor = await prisma.proveedor.upsert({
    where: { rutNormalizado },
    create: {
      slug,
      nombre: nombreEmpresa,
      razonSocial: nombreEmpresa,
      rutNormalizado,
      email,
      telefonoE164,
      estado: EstadoProveedor.PENDIENTE,
      usuarioId,
      coberturaNacional: expansion.nacional,
      comunaBaseId,
      solicitudEspera: snapshot,
      vistoAt: null,
    },
    update: {
      nombre: nombreEmpresa,
      razonSocial: nombreEmpresa,
      email,
      telefonoE164,
      estado:
        existente?.estado === EstadoProveedor.APROBADO
          ? EstadoProveedor.APROBADO
          : EstadoProveedor.PENDIENTE,
      usuarioId,
      coberturaNacional: expansion.nacional,
      comunaBaseId,
      solicitudEspera: snapshot,
    },
  })

  await prisma.cobertura.deleteMany({ where: { proveedorId: proveedor.id } })

  if (!expansion.nacional && comunasExpandidas.length > 0) {
    await prisma.cobertura.createMany({
      data: rubrosActivos.flatMap((rubro) =>
        comunasExpandidas.map((comuna) => ({
          proveedorId: proveedor.id,
          rubroId: rubro.id,
          comunaId: comuna.id,
          activa: true,
        })),
      ),
      skipDuplicates: true,
    })
  }

  const otp = await enviarOtpAUsuario({
    usuarioId,
    telefonoE164,
    forzar: true,
  })

  if (!otp.ok) {
    return {
      ok: false,
      mensaje: otp.mensaje ?? 'No pudimos enviarte el código. Reintenta.',
      telefono: telefonoE164,
      telefonoEnmascarado: otp.telefonoEnmascarado,
    }
  }

  return {
    ok: true,
    requiereOtp: true,
    telefono: telefonoE164,
    telefonoEnmascarado: otp.telefonoEnmascarado,
    mensaje: otp.mensaje ?? 'Te enviamos un código de 6 dígitos.',
  }
}
