'use server'

import { headers } from 'next/headers'
import { EstadoProveedor, RolUsuario } from '@prisma/client'

import { expandirCobertura, type SnapshotCoberturaProveedor } from '@/lib/cobertura'
import { validarCuentaProveedor } from '@/lib/cuenta-proveedor'
import {
  elegirFilaProveedorPorRut,
  esRutGard,
  GARD_SLUG,
  slugAltaProveedor,
} from '@/lib/gard'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'
import { normalizarRut, variantesRutPersistido } from '@/lib/rut'
import { normalizarTelefonoE164 } from '@/lib/telefono'
import { avisarAdminAltaProveedor } from '@/server/avisos'
import { activarProveedorTrasOtp } from '@/server/creditos'
import { abrirSesionUsuario, enviarOtpAUsuario } from '@/server/otp'

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

/**
 * Crea o reutiliza User + Proveedor, persiste cobertura y envía OTP
 * (o abre sesión si el celular ya estaba verificado).
 * Si el RUT ya existe (canónico o solo dígitos), reclama esa fila.
 * El RUT de Gard ancla a `gard-security`; no se inventa un segundo Gard.
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
    password: formData.get('password'),
    passwordConfirmacion: formData.get('passwordConfirmacion'),
    rubros: formData.getAll('rubros'),
    modoCobertura: formData.get('modoCobertura'),
    regiones: formData.getAll('regiones'),
    provincias: formData.getAll('provincias'),
    comunas: formData.getAll('comunas'),
  })

  if (!validacion.ok) {
    return { ok: false, mensaje: 'Revisa los datos marcados.', errores: validacion.errores }
  }

  const { nombreEmpresa, rubros, cobertura, email, password } = validacion.datos
  const rutNormalizado = normalizarRut(validacion.datos.rut)
  const telefonoE164 = normalizarTelefonoE164(validacion.datos.telefono)
  if (!rutNormalizado || !telefonoE164) {
    return { ok: false, mensaje: 'Revisa el RUT y el celular.' }
  }

  const passwordHash = await hashPassword(password)

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

  const variantesRut = variantesRutPersistido(rutNormalizado)
  const candidatos = await prisma.proveedor.findMany({
    where: {
      OR: [
        { rutNormalizado: { in: variantesRut } },
        ...(esRutGard(rutNormalizado) ? [{ slug: GARD_SLUG }] : []),
      ],
    },
    select: {
      id: true,
      slug: true,
      estado: true,
      usuarioId: true,
      rutNormalizado: true,
      usuario: { select: { id: true, rol: true, telefonoE164Verificado: true } },
    },
  })
  const existente = elegirFilaProveedorPorRut(candidatos)

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

  // Cualquier User con este teléfono (comprador o proveedor): se reutiliza.
  const usuarioExistentePorTelefono = await prisma.user.findFirst({
    where: { telefonoE164Verificado: telefonoE164 },
  })

  const emailOcupado = await prisma.user.findUnique({
    where: { email },
    select: { id: true, rol: true },
  })

  let usuarioId = existente?.usuarioId ?? usuarioExistentePorTelefono?.id ?? null

  if (emailOcupado && emailOcupado.id !== usuarioId) {
    return {
      ok: false,
      errores: { email: 'Ese correo ya está en uso. Entra con tu cuenta o usa otro.' },
      mensaje: 'Ese correo ya está en uso.',
    }
  }

  if (!usuarioId) {
    const creado = await prisma.user.create({
      data: {
        name: nombreEmpresa,
        email,
        passwordHash,
        rol: RolUsuario.PROVEEDOR,
      },
    })
    usuarioId = creado.id
  } else {
    // Eleva comprador→proveedor (rol = capacidad máxima) y guarda contraseña.
    await prisma.user.update({
      where: { id: usuarioId },
      data: {
        name: nombreEmpresa,
        rol: RolUsuario.PROVEEDOR,
        email,
        passwordHash,
      },
    })
  }

  const slug = slugAltaProveedor(rutNormalizado, existente?.slug)
  const comunaBaseId = expansion.nacional ? null : (comunasExpandidas[0]?.id ?? null)
  const rutOcupadoPorOtro = existente
    ? Boolean(
        await prisma.proveedor.findFirst({
          where: { rutNormalizado, NOT: { id: existente.id } },
          select: { id: true },
        }),
      )
    : false

  const datosComunes = {
    nombre: nombreEmpresa,
    razonSocial: nombreEmpresa,
    email,
    telefonoE164,
    coberturaNacional: expansion.nacional,
    comunaBaseId,
    solicitudEspera: snapshot,
    usuarioId,
  }

  const proveedor = existente
    ? await prisma.proveedor.update({
        where: { id: existente.id },
        data: {
          ...datosComunes,
          estado:
            existente.estado === EstadoProveedor.APROBADO
              ? EstadoProveedor.APROBADO
              : EstadoProveedor.PENDIENTE,
          ...(!rutOcupadoPorOtro ? { rutNormalizado } : {}),
        },
      })
    : await prisma.proveedor.create({
        data: {
          slug,
          ...datosComunes,
          rutNormalizado,
          estado: EstadoProveedor.PENDIENTE,
          vistoAt: null,
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

  const usuario = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { telefonoE164Verificado: true },
  })
  const telefonoYaVerificado = usuario?.telefonoE164Verificado === telefonoE164

  if (telefonoYaVerificado) {
    // OTP una sola vez por cuenta: no se vuelve a pedir. Pack de arranque
    // idempotente por `alta:{proveedorId}`.
    const alta = await activarProveedorTrasOtp(usuarioId)
    if (alta.recienAprobado && alta.proveedorId) {
      await avisarAdminAltaProveedor(alta.proveedorId)
    }
    await abrirSesionUsuario(usuarioId)
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
