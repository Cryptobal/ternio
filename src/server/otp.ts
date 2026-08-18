'use server'

import { AuthError } from 'next-auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ActorTransicion,
  EstadoLead,
  ModoRubro,
  RolUsuario,
  TipoEventoAnalitica,
  TipoTransicionLead,
} from '@prisma/client'

import { signIn } from '@/auth'
import { registrarEvento } from '@/lib/analitica'
import { NOMBRE_COOKIE_CLAIM, verificarClaimToken } from '@/lib/claim-token'
import { debeAvisarAdminLeadVerificado } from '@/lib/email'
import {
  OTP_EXPIRA_MS,
  OTP_REENVIO_MS,
  OTP_SESION_EXPIRA_MS,
  OTP_TOPE_POR_HORA,
  emitirTokenSesionOtp,
  enmascararTelefono,
  evaluarIntentoOtp,
  generarCodigoOtp,
  hashCodigoOtp,
} from '@/lib/otp'
import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'
import { reclamarLeadsPorHash, reclamarLeadsPorTelefono } from '@/lib/reclamo'
import { enviarSms } from '@/lib/sms'
import { esMovil, normalizarTelefonoE164 } from '@/lib/telefono'
import {
  avisarAdminAltaProveedor,
  avisarAdminLeadVerificado,
  avisarProveedoresLeadVerificado,
} from '@/server/avisos'
import { destinoTrasLoginUsuario } from '@/server/capacidades'
import { activarProveedorTrasOtp } from '@/server/creditos'
import { usuarioActualId } from '@/server/sesion'

export type EstadoOtp = {
  ok: boolean
  mensaje?: string
  telefonoEnmascarado?: string
  reintentarEnSegundos?: number
}

async function ipDelCliente(): Promise<string> {
  const cabeceras = await headers()
  const reenviada = cabeceras.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || cabeceras.get('x-real-ip') || 'desconocida'
}

async function telefonoDesdeCookieReclamo(): Promise<{
  telefonoE164: string
  email: string | null
  nombre: string | null
} | null> {
  const token = (await cookies()).get(NOMBRE_COOKIE_CLAIM)?.value
  const hash = verificarClaimToken(token)
  if (!hash) return null

  const lead = await prisma.lead.findFirst({
    where: { claimTokenHash: hash },
    orderBy: { createdAt: 'desc' },
    select: {
      contacto: { select: { telefonoE164: true, email: true, nombreContacto: true } },
    },
  })

  if (!lead?.contacto) return null
  return {
    telefonoE164: lead.contacto.telefonoE164,
    email: lead.contacto.email,
    nombre: lead.contacto.nombreContacto,
  }
}

async function resolverUsuarioOtp(args: {
  telefonoE164: string
  emailSugerido?: string | null
  nombreSugerido?: string | null
}) {
  const porTelefono = await prisma.user.findFirst({
    where: { telefonoE164Verificado: args.telefonoE164 },
  })
  if (porTelefono) return porTelefono

  const email = args.emailSugerido?.trim().toLowerCase() || null
  if (email) {
    const porEmail = await prisma.user.findUnique({ where: { email } })
    if (porEmail && porEmail.emailVerified && !porEmail.telefonoE164Verificado) {
      return porEmail
    }
  }

  const previa = await prisma.verificacionOtp.findFirst({
    where: { telefonoE164: args.telefonoE164 },
    orderBy: { createdAt: 'desc' },
    select: { usuarioId: true },
  })
  if (previa) {
    const existente = await prisma.user.findUnique({ where: { id: previa.usuarioId } })
    if (existente && !existente.telefonoE164Verificado) return existente
  }

  const emailLibre =
    email && !(await prisma.user.findUnique({ where: { email }, select: { id: true } }))

  return prisma.user.create({
    data: {
      email: emailLibre ? email : undefined,
      name: args.nombreSugerido ?? undefined,
      rol: RolUsuario.COMPRADOR,
    },
  })
}

async function emitirYEnviarCodigo(args: {
  usuarioId: string
  telefonoE164: string
  leadId?: string | null
  forzar?: boolean
}): Promise<EstadoOtp> {
  const vigente = args.forzar
    ? null
    : await prisma.verificacionOtp.findFirst({
        where: {
          usuarioId: args.usuarioId,
          telefonoE164: args.telefonoE164,
          consumidoAt: null,
          expiraAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })
  if (vigente) {
    return {
      ok: true,
      mensaje: 'Ya te enviamos un código. Revisa el SMS o espera un minuto para pedir otro.',
      telefonoEnmascarado: enmascararTelefono(args.telefonoE164),
    }
  }

  const ip = await ipDelCliente()
  const limiteIp = consumirRateLimit(`otp-enviar-ip:${ip}`, 8, 60 * 60_000)
  const limiteHora = consumirRateLimit(
    `otp-hora:${args.telefonoE164}`,
    OTP_TOPE_POR_HORA,
    60 * 60_000,
  )
  const cooldown = consumirRateLimit(`otp-reenvio:${args.telefonoE164}`, 1, OTP_REENVIO_MS)

  if (!limiteIp.permitido || !limiteHora.permitido) {
    return {
      ok: false,
      mensaje: 'Recibimos varios intentos. Espera un rato y reintenta.',
      reintentarEnSegundos: Math.max(limiteIp.reintentarEnSegundos, limiteHora.reintentarEnSegundos),
    }
  }
  if (!cooldown.permitido) {
    return {
      ok: false,
      mensaje: 'Te acabamos de enviar un código. Espera un minuto para pedir otro.',
      reintentarEnSegundos: cooldown.reintentarEnSegundos,
      telefonoEnmascarado: enmascararTelefono(args.telefonoE164),
    }
  }

  const codigo = generarCodigoOtp()
  const codigoHash = hashCodigoOtp(codigo)

  const creado = await prisma.verificacionOtp.create({
    data: {
      usuarioId: args.usuarioId,
      leadId: args.leadId ?? null,
      telefonoE164: args.telefonoE164,
      codigoHash,
      expiraAt: new Date(Date.now() + OTP_EXPIRA_MS),
    },
  })

  const envio = await enviarSms(
    args.telefonoE164,
    `Tu código Ternio es ${codigo}. Vence en 10 minutos.`,
  )

  if (!envio.ok) {
    await prisma.verificacionOtp.delete({ where: { id: creado.id } })
    return {
      ok: false,
      mensaje: envio.motivo,
      telefonoEnmascarado: enmascararTelefono(args.telefonoE164),
    }
  }

  return {
    ok: true,
    mensaje: 'Te enviamos un código de 6 dígitos.',
    telefonoEnmascarado: enmascararTelefono(args.telefonoE164),
  }
}

export async function solicitarOtpDesdeReclamoAction(): Promise<EstadoOtp> {
  return solicitarOtpDesdeReclamo(false)
}

async function solicitarOtpDesdeReclamo(forzar: boolean): Promise<EstadoOtp> {
  if (await usuarioActualId()) {
    return { ok: true, mensaje: 'Ya tienes sesión.' }
  }

  const contacto = await telefonoDesdeCookieReclamo()
  if (!contacto) {
    return {
      ok: false,
      mensaje: 'No encontramos una cotización reciente en este navegador. Entra con tu teléfono.',
    }
  }

  if (!esMovil(contacto.telefonoE164)) {
    return { ok: false, mensaje: 'El código llega a un celular chileno (+56 9).' }
  }

  const usuario = await resolverUsuarioOtp({
    telefonoE164: contacto.telefonoE164,
    emailSugerido: contacto.email,
    nombreSugerido: contacto.nombre,
  })

  const lead = await prisma.lead.findFirst({
    where: { contacto: { telefonoE164: contacto.telefonoE164 } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  return emitirYEnviarCodigo({
    usuarioId: usuario.id,
    telefonoE164: contacto.telefonoE164,
    leadId: lead?.id,
    forzar,
  })
}

export async function solicitarOtpEntrarAction(
  _previo: EstadoOtp,
  formData: FormData,
): Promise<EstadoOtp> {
  const sesionId = await usuarioActualId()
  if (sesionId) {
    redirect(await destinoTrasLoginUsuario(sesionId))
  }

  const telefonoE164 = normalizarTelefonoE164(String(formData.get('telefono') ?? ''))
  if (!telefonoE164 || !esMovil(telefonoE164)) {
    return { ok: false, mensaje: 'Revisa el teléfono: usa un celular chileno, por ejemplo +56 9 1234 5678.' }
  }

  const usuario = await resolverUsuarioOtp({ telefonoE164 })
  return emitirYEnviarCodigo({
    usuarioId: usuario.id,
    telefonoE164,
    forzar: String(formData.get('forzar') ?? '') === '1',
  })
}

export async function enviarOtpAUsuario(args: {
  usuarioId: string
  telefonoE164: string
  forzar?: boolean
}): Promise<EstadoOtp> {
  return emitirYEnviarCodigo({
    usuarioId: args.usuarioId,
    telefonoE164: args.telefonoE164,
    forzar: args.forzar,
  })
}

async function abrirSesionOtp(
  usuarioId: string,
  opts?: { forzarMisCotizaciones?: boolean },
): Promise<never> {
  const destino = await destinoTrasLoginUsuario(usuarioId, {
    forzarMisCotizaciones: opts?.forzarMisCotizaciones,
  })

  const { token, hash } = emitirTokenSesionOtp()
  await prisma.verificationToken.deleteMany({
    where: { identifier: `otp-sesion:${usuarioId}` },
  })
  await prisma.verificationToken.create({
    data: {
      identifier: `otp-sesion:${usuarioId}`,
      token: hash,
      expires: new Date(Date.now() + OTP_SESION_EXPIRA_MS),
    },
  })

  try {
    await signIn('otp', { token, redirectTo: destino })
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error('No pudimos abrir tu sesión. Reintenta.')
    }
    throw error
  }

  redirect(destino)
}

/** Abre sesión sin SMS cuando el teléfono ya estaba verificado (alta proveedor). */
export async function abrirSesionUsuario(usuarioId: string): Promise<never> {
  return abrirSesionOtp(usuarioId)
}

async function aplicarTelefonoVerificado(usuarioId: string, telefonoE164: string): Promise<void> {
  await prisma.user.update({
    where: { id: usuarioId },
    data: { telefonoE164Verificado: telefonoE164, telefonoVerificadoAt: new Date() },
  })

  const leads = await prisma.lead.findMany({
    where: {
      compradorUsuarioId: usuarioId,
      telefonoVerificado: false,
      contacto: { telefonoE164 },
    },
    select: {
      id: true,
      estado: true,
      rutValido: true,
      modoRubroAlCrear: true,
    },
  })

  for (const lead of leads) {
    const pasaAVenta =
      lead.rutValido &&
      lead.modoRubroAlCrear === ModoRubro.VENTA &&
      (lead.estado === EstadoLead.RECIBIDO || lead.estado === EstadoLead.EN_REVISION)

    await prisma.$transaction([
      prisma.lead.update({
        where: { id: lead.id },
        data: {
          telefonoVerificado: true,
          estado: pasaAVenta ? EstadoLead.VERIFICADO : lead.estado,
          verificadoAt: pasaAVenta ? new Date() : undefined,
        },
      }),
      prisma.transicionLead.create({
        data: {
          leadId: lead.id,
          tipo: TipoTransicionLead.TELEFONO_VERIFICADO,
          estadoDesde: lead.estado,
          estadoHasta: pasaAVenta ? EstadoLead.VERIFICADO : lead.estado,
          actor: ActorTransicion.COMPRADOR,
          actorUsuarioId: usuarioId,
          nota: 'Teléfono confirmado por código SMS.',
        },
      }),
      ...(pasaAVenta
        ? [
            prisma.transicionLead.create({
              data: {
                leadId: lead.id,
                tipo: TipoTransicionLead.VERIFICADO,
                estadoDesde: lead.estado,
                estadoHasta: EstadoLead.VERIFICADO,
                actor: ActorTransicion.SISTEMA,
                actorUsuarioId: usuarioId,
                nota: 'RUT válido y teléfono verificado.',
              },
            }),
          ]
        : []),
    ])

    if (pasaAVenta) {
      await avisarProveedoresLeadVerificado(lead.id)
      if (debeAvisarAdminLeadVerificado(lead.estado)) {
        await avisarAdminLeadVerificado(lead.id)
      }
    }
  }
}

export async function confirmarOtpAction(
  _previo: EstadoOtp,
  formData: FormData,
): Promise<EstadoOtp> {
  const ip = await ipDelCliente()
  const limiteIp = consumirRateLimit(`otp-verificar-ip:${ip}`, 15, 15 * 60_000)
  if (!limiteIp.permitido) {
    return { ok: false, mensaje: 'Demasiados intentos. Espera un rato y reintenta.' }
  }

  const origen = String(formData.get('origen') ?? 'entrar')
  const codigo = String(formData.get('codigo') ?? '').replace(/\D/g, '')

  let telefonoE164: string | null = null
  if (origen === 'reclamo') {
    telefonoE164 = (await telefonoDesdeCookieReclamo())?.telefonoE164 ?? null
  } else {
    telefonoE164 = normalizarTelefonoE164(String(formData.get('telefono') ?? ''))
  }

  if (!telefonoE164) {
    return { ok: false, mensaje: 'No encontramos el teléfono de esta verificación.' }
  }

  const limiteTel = consumirRateLimit(`otp-verificar-tel:${telefonoE164}`, 10, 15 * 60_000)
  if (!limiteTel.permitido) {
    return { ok: false, mensaje: 'Demasiados intentos con este teléfono. Espera un rato.' }
  }

  const otp = await prisma.verificacionOtp.findFirst({
    where: { telefonoE164, consumidoAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) {
    return { ok: false, mensaje: 'El código no es válido o ya venció. Pide uno nuevo.' }
  }

  const evaluacion = evaluarIntentoOtp({
    codigo,
    hash: otp.codigoHash,
    expiraAt: otp.expiraAt,
    consumidoAt: otp.consumidoAt,
    intentos: otp.intentos,
  })

  if (!evaluacion.ok) {
    await prisma.verificacionOtp.update({
      where: { id: otp.id },
      data: { intentos: { increment: 1 } },
    })
    const mensaje =
      evaluacion.motivo === 'expirado'
        ? 'El código venció. Pide uno nuevo.'
        : evaluacion.motivo === 'intentos'
          ? 'Agotaste los intentos de este código. Pide uno nuevo.'
          : 'Ese código no coincide. Revisa y reintenta.'
    return { ok: false, mensaje }
  }

  await prisma.verificacionOtp.update({
    where: { id: otp.id },
    data: { consumidoAt: new Date() },
  })

  const duenio = await prisma.user.findUnique({
    where: { id: otp.usuarioId },
    select: { rol: true, proveedor: { select: { id: true } } },
  })

  const cookie = (await cookies()).get(NOMBRE_COOKIE_CLAIM)?.value
  const hash = verificarClaimToken(cookie)
  if (hash) await reclamarLeadsPorHash(prisma, hash, otp.usuarioId)
  await reclamarLeadsPorTelefono(prisma, telefonoE164, otp.usuarioId)
  await aplicarTelefonoVerificado(otp.usuarioId, telefonoE164)

  if (duenio?.proveedor || duenio?.rol === RolUsuario.PROVEEDOR) {
    const alta = await activarProveedorTrasOtp(otp.usuarioId)
    if (alta.recienAprobado && alta.proveedorId) {
      await avisarAdminAltaProveedor(alta.proveedorId)
    }
  }

  const yaRegistrado = await prisma.eventoAnalitica.findFirst({
    where: { tipo: TipoEventoAnalitica.CUENTA_CREADA, usuarioId: otp.usuarioId },
    select: { id: true },
  })
  if (!yaRegistrado) {
    await registrarEvento({
      tipo: TipoEventoAnalitica.CUENTA_CREADA,
      usuarioId: otp.usuarioId,
      path: origen === 'reclamo' ? '/cotizacion/enviada' : '/entrar',
    })
  }

  await abrirSesionOtp(otp.usuarioId, {
    forzarMisCotizaciones: origen === 'reclamo',
  })
  return { ok: true, mensaje: 'Sesión abierta.' }
}

export async function reenviarOtpAction(
  _previo: EstadoOtp,
  formData: FormData,
): Promise<EstadoOtp> {
  const origen = String(formData.get('origen') ?? 'entrar')
  if (origen === 'reclamo') return solicitarOtpDesdeReclamo(true)
  formData.set('forzar', '1')
  return solicitarOtpEntrarAction({ ok: false }, formData)
}
