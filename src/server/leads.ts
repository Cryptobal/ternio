'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ActorTransicion,
  EstadoLead,
  ModoRubro,
  OrigenSolicitudRubro,
  TipoEventoAnalitica,
  TipoTransicionLead,
} from '@prisma/client'

import { registrarEvento } from '@/lib/analitica'
import { parsearCampos, validarValoresCampos } from '@/lib/campos'
import {
  NOMBRE_COOKIE_CLAIM,
  VIGENCIA_CLAIM_TOKEN_SEGUNDOS,
  emitirClaimToken,
  verificarClaimToken,
} from '@/lib/claim-token'
import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'
import { reclamarLeadsPorHash } from '@/lib/reclamo'
import { estadoInicialLead } from '@/lib/rubros'
import { calcularScore } from '@/lib/score'
import { esMovil } from '@/lib/telefono'
import { verificarTurnstile } from '@/lib/turnstile'
import { audienciaParaLead } from '@/lib/audiencia'
import { validarIdentidadTronco } from '@/lib/validar-identidad'
import { avisarAdminLeadCreado, avisarProveedoresLeadVerificado } from '@/server/avisos'
import { usuarioActualId } from '@/server/sesion'

/** Ventana de deduplicación por RUT o teléfono dentro del mismo rubro. */
const VENTANA_DEDUPE_HORAS = 24

export type EstadoFormulario = {
  ok: boolean
  mensaje?: string
  errores?: Record<string, string>
}

async function ipDelCliente(): Promise<string> {
  const cabeceras = await headers()
  const reenviada = cabeceras.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || cabeceras.get('x-real-ip') || 'desconocida'
}

/**
 * Crea la cotización. El formulario NUNCA se bloquea por login: si hay sesión
 * el lead queda asignado de inmediato, y si no, se deja una cookie firmada
 * para que el comprador lo reclame al confirmar el teléfono.
 */
export async function crearLeadAction(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const rubroSlug = String(formData.get('rubro') ?? '')
  const comunaSlug = String(formData.get('comuna') ?? '')

  // Honeypot: un bot llena todos los campos. Le respondemos como si todo
  // hubiera salido bien y no guardamos nada.
  if (String(formData.get('sitio_web') ?? '').trim() !== '') {
    redirect('/cotizacion/enviada')
  }

  const ip = await ipDelCliente()
  const limite = consumirRateLimit(`crear-lead:${ip}`, 5, 10 * 60_000)
  if (!limite.permitido) {
    return {
      ok: false,
      mensaje: `Recibimos varias solicitudes desde tu conexión. Vuelve a intentar en ${Math.ceil(
        limite.reintentarEnSegundos / 60,
      )} minutos.`,
    }
  }

  const [rubro, comuna] = await Promise.all([
    prisma.rubro.findFirst({
      where: { slug: rubroSlug, activo: true },
      select: { id: true, modo: true, camposFormulario: true },
    }),
    prisma.comuna.findFirst({
      where: { slug: comunaSlug, activa: true },
      select: { id: true },
    }),
  ])

  if (!rubro || !comuna) {
    return {
      ok: false,
      mensaje: 'No encontramos ese servicio o comuna. Revisa e inténtalo de nuevo.',
    }
  }

  // Turnstile fail-closed: sin verificación no hay lead.
  const turnstile = await verificarTurnstile(
    String(formData.get('cf-turnstile-response') ?? ''),
    ip,
  )
  if (!turnstile.ok) {
    return { ok: false, mensaje: turnstile.motivo }
  }

  const errores: Record<string, string> = {}
  const audiencia = audienciaParaLead(formData.get('audiencia'), rubroSlug)
  if (!audiencia) {
    errores.audiencia = 'Elige si es para la casa o para la empresa.'
  }

  const identidad = validarIdentidadTronco({
    razonSocial: formData.get('razonSocial'),
    rut: formData.get('rut'),
    nombreContacto: formData.get('nombreContacto'),
    telefono: formData.get('telefono'),
    email: formData.get('email'),
  })
  if (!identidad.ok) Object.assign(errores, identidad.errores)

  const campos = parsearCampos(rubro.camposFormulario)
  const entradaCampos: Record<string, unknown> = {}
  for (const campo of campos) {
    entradaCampos[campo.nombre] =
      campo.tipo === 'opcion_multiple' ? formData.getAll(campo.nombre) : formData.get(campo.nombre)
  }
  const valores = validarValoresCampos(campos, entradaCampos)
  if (!valores.ok) Object.assign(errores, valores.errores)

  if (Object.keys(errores).length > 0 || !identidad.ok || !valores.ok) {
    return { ok: false, mensaje: 'Revisa los datos marcados.', errores }
  }

  const { razonSocial, rutNormalizado, nombreContacto, telefonoE164, email } = identidad.datos

  const compradorUsuarioId = await usuarioActualId()
  const comprador = compradorUsuarioId
    ? await prisma.user.findUnique({
        where: { id: compradorUsuarioId },
        select: { telefonoE164Verificado: true },
      })
    : null
  const telefonoYaVerificado =
    Boolean(comprador?.telefonoE164Verificado) &&
    comprador?.telefonoE164Verificado === telefonoE164

  // Deduplicación: el mismo RUT o teléfono, en el mismo rubro, dentro de la
  // ventana, no genera un segundo lead vendible.
  const desde = new Date(Date.now() - VENTANA_DEDUPE_HORAS * 60 * 60 * 1000)
  const duplicado = await prisma.leadContacto.findFirst({
    where: {
      OR: [{ rutNormalizado }, { telefonoE164 }],
      lead: {
        rubroId: rubro.id,
        createdAt: { gte: desde },
        estado: { notIn: [EstadoLead.DESCARTADO, EstadoLead.ARCHIVADO] },
      },
    },
    select: { leadId: true },
  })

  if (duplicado) {
    // Si ya tiene cuenta, aprovechamos de dejarle el lead asignado.
    if (compradorUsuarioId) {
      await prisma.lead.updateMany({
        where: { id: duplicado.leadId, compradorUsuarioId: null },
        data: { compradorUsuarioId },
      })
    }
    redirect('/cotizacion/enviada?estado=duplicada')
  }

  const modo = rubro.modo
  const pasaAVenta =
    modo === ModoRubro.VENTA && telefonoYaVerificado
  const estado = pasaAVenta ? EstadoLead.VERIFICADO : estadoInicialLead(modo)

  // El texto libre puede traer nombres, direcciones o teléfonos: vive solo en
  // LeadContacto, nunca en `datos`, que es lo que alimenta la ficha anónima.
  const { detalle: detalleLibre, ...datosAnonimos } = valores.valores
  const detalle = detalleLibre ?? ''
  const score = calcularScore({
    rutValido: true,
    telefonoVerificado: telefonoYaVerificado,
    email,
    esMovil: esMovil(telefonoE164),
    razonSocialDeclarada: Boolean(razonSocial),
    largoDetalle: detalle.length,
    plazo: valores.valores.plazo,
  })

  // Reusamos el token de reclamo del navegador si sigue vigente, para que una
  // sola cuenta se lleve todas las cotizaciones de la sesión.
  const almacenCookies = await cookies()
  const tokenExistente = almacenCookies.get(NOMBRE_COOKIE_CLAIM)?.value
  const hashExistente = verificarClaimToken(tokenExistente)
  const claim = hashExistente ? null : emitirClaimToken()
  const claimTokenHash = hashExistente ?? claim?.hash ?? null

  const lead = await prisma.$transaction(async (tx) => {
    const creado = await tx.lead.create({
      data: {
        rubroId: rubro.id,
        comunaId: comuna.id,
        estado,
        score,
        datos: datosAnonimos,
        modoRubroAlCrear: modo,
        audiencia,
        rutValido: true,
        telefonoVerificado: telefonoYaVerificado,
        verificadoAt: pasaAVenta ? new Date() : undefined,
        whatsappOptIn: String(formData.get('whatsappOptIn') ?? '') === 'on',
        compradorUsuarioId,
        claimTokenHash,
        origen: 'formulario_web',
      },
      select: { id: true },
    })

    await tx.leadContacto.create({
      data: {
        leadId: creado.id,
        nombreContacto,
        email,
        telefonoE164,
        rutNormalizado,
        razonSocial,
        detalle: detalle || null,
      },
    })

    await tx.transicionLead.create({
      data: {
        leadId: creado.id,
        tipo: TipoTransicionLead.CREADO,
        estadoHasta: estado,
        actor: ActorTransicion.COMPRADOR,
        actorUsuarioId: compradorUsuarioId,
        nota: 'Cotización enviada desde el formulario web.',
      },
    })

    await tx.transicionLead.create({
      data: {
        leadId: creado.id,
        tipo: TipoTransicionLead.RUT_VALIDADO,
        estadoDesde: estado,
        estadoHasta: estado,
        nota: 'RUT con dígito verificador válido.',
      },
    })

    if (telefonoYaVerificado) {
      await tx.transicionLead.create({
        data: {
          leadId: creado.id,
          tipo: TipoTransicionLead.TELEFONO_VERIFICADO,
          estadoDesde: estadoInicialLead(modo),
          estadoHasta: estado,
          actor: ActorTransicion.COMPRADOR,
          actorUsuarioId: compradorUsuarioId,
          nota: 'Teléfono ya verificado en esta cuenta; no se pide de nuevo.',
        },
      })
    }

    if (pasaAVenta) {
      await tx.transicionLead.create({
        data: {
          leadId: creado.id,
          tipo: TipoTransicionLead.VERIFICADO,
          estadoDesde: estadoInicialLead(modo),
          estadoHasta: EstadoLead.VERIFICADO,
          actor: ActorTransicion.SISTEMA,
          actorUsuarioId: compradorUsuarioId,
          nota: 'RUT válido y teléfono ya verificado en esta cuenta.',
        },
      })
    }

    if (modo === ModoRubro.CAPTURA) {
      await tx.transicionLead.create({
        data: {
          leadId: creado.id,
          tipo: TipoTransicionLead.EN_LISTA_ESPERA,
          estadoDesde: estado,
          estadoHasta: EstadoLead.LISTA_ESPERA,
          nota: 'Rubro en modo captura: el lead queda en lista de espera y no se ofrece.',
        },
      })
    }

    return creado
  })

  if (claim) {
    almacenCookies.set(NOMBRE_COOKIE_CLAIM, claim.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: VIGENCIA_CLAIM_TOKEN_SEGUNDOS,
    })
  }

  await registrarEvento({
    tipo: TipoEventoAnalitica.LEAD_CREADO,
    rubroId: rubro.id,
    comunaId: comuna.id,
    leadId: lead.id,
    usuarioId: compradorUsuarioId,
    path: `/${rubroSlug}/${comunaSlug}`,
    metadata: { modo, estado },
  })

  await avisarAdminLeadCreado(lead.id)
  if (pasaAVenta) {
    await avisarProveedoresLeadVerificado(lead.id)
  }

  redirect('/cotizacion/enviada')
}

/**
 * "Otro servicio": registra demanda de un rubro que todavía no cubrimos.
 * Nunca crea un lead vendible; solo alimenta la tabla que decide qué rubro se
 * abre después.
 */
export async function solicitarOtroServicioAction(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const texto = String(formData.get('textoRubro') ?? '').trim()

  if (texto.length < 3) {
    return { ok: false, mensaje: 'Cuéntanos qué servicio necesitas.' }
  }

  const ip = await ipDelCliente()
  const limite = consumirRateLimit(`otro-servicio:${ip}`, 5, 10 * 60_000)
  if (!limite.permitido) {
    return { ok: false, mensaje: 'Ya recibimos tu solicitud. Gracias.' }
  }

  const comunaSlug = String(formData.get('comuna') ?? '')
  const comuna = comunaSlug
    ? await prisma.comuna.findUnique({ where: { slug: comunaSlug }, select: { id: true } })
    : null

  await prisma.solicitudRubro.create({
    data: {
      textoRubro: texto.slice(0, 500),
      origen: OrigenSolicitudRubro.COTIZADOR,
      comunaId: comuna?.id ?? null,
      usuarioId: await usuarioActualId(),
    },
  })

  return {
    ok: true,
    mensaje:
      'Anotado. Te avisamos apenas tengamos proveedores de ese servicio en tu zona.',
  }
}

/**
 * Reclama, para la cuenta recién creada, los leads enviados desde este
 * navegador. Idempotente: correrla dos veces no cambia nada.
 */
export async function reclamarLeadsAction(): Promise<{ reclamados: number }> {
  const usuarioId = await usuarioActualId()
  if (!usuarioId) return { reclamados: 0 }

  const almacenCookies = await cookies()
  const token = almacenCookies.get(NOMBRE_COOKIE_CLAIM)?.value
  const hash = verificarClaimToken(token)
  if (!hash) return { reclamados: 0 }

  const pendientes = await reclamarLeadsPorHash(prisma, hash, usuarioId)

  if (pendientes.length === 0) return { reclamados: 0 }

  // CUENTA_CREADA es un paso del embudo por cuenta, no por cotización: se
  // registra una sola vez aunque el comprador reclame varias cotizaciones.
  const yaRegistrado = await prisma.eventoAnalitica.findFirst({
    where: { tipo: TipoEventoAnalitica.CUENTA_CREADA, usuarioId },
    select: { id: true },
  })

  if (!yaRegistrado) {
    const primero = pendientes[0]
    await registrarEvento({
      tipo: TipoEventoAnalitica.CUENTA_CREADA,
      leadId: primero?.id ?? null,
      rubroId: primero?.rubroId ?? null,
      comunaId: primero?.comunaId ?? null,
      usuarioId,
      path: '/cotizacion/enviada',
      metadata: { cotizacionesReclamadas: pendientes.length },
    })
  }

  return { reclamados: pendientes.length }
}
