import 'server-only'

import { Prisma, TipoEventoAnalitica } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Embudo de Fase 0: VISITA_PAGINA → FORM_START → LEAD_CREADO → CUENTA_CREADA.
 * Es la medición que decide el go/no-go, así que se guarda en nuestra propia
 * base y no depende de un tercero.
 *
 * Sin PII: solo identificadores internos y un id anónimo de navegador.
 */

export type EntradaEvento = {
  tipo: TipoEventoAnalitica
  rubroId?: string | null
  comunaId?: string | null
  leadId?: string | null
  usuarioId?: string | null
  sesionAnonId?: string | null
  path?: string | null
  metadata?: Record<string, string | number | boolean> | null
  idempotencyKey?: string
}

/**
 * Registrar un evento nunca puede tumbar el flujo del comprador: si la
 * escritura falla, se pierde la métrica, no la cotización.
 */
export async function registrarEvento(entrada: EntradaEvento): Promise<void> {
  try {
    await prisma.eventoAnalitica.create({
      data: {
        tipo: entrada.tipo,
        rubroId: entrada.rubroId ?? null,
        comunaId: entrada.comunaId ?? null,
        leadId: entrada.leadId ?? null,
        usuarioId: entrada.usuarioId ?? null,
        sesionAnonId: entrada.sesionAnonId ?? null,
        path: entrada.path ?? null,
        metadata: entrada.metadata ?? undefined,
        idempotencyKey: entrada.idempotencyKey,
      },
    })
  } catch (error) {
    console.error('[analitica] no se pudo registrar el evento', {
      tipo: entrada.tipo,
      error: error instanceof Error ? error.message : 'desconocido',
    })
  }
}

export type ReservaAviso = 'creado' | 'duplicado' | 'error'

/** Reserva un aviso una sola vez. Unique en `idempotencyKey`. */
export async function reservarAvisoEmail(
  entrada: EntradaEvento & { idempotencyKey: string },
): Promise<ReservaAviso> {
  try {
    await prisma.eventoAnalitica.create({
      data: {
        tipo: entrada.tipo,
        rubroId: entrada.rubroId ?? null,
        comunaId: entrada.comunaId ?? null,
        leadId: entrada.leadId ?? null,
        usuarioId: entrada.usuarioId ?? null,
        sesionAnonId: entrada.sesionAnonId ?? null,
        path: entrada.path ?? null,
        metadata: entrada.metadata ?? undefined,
        idempotencyKey: entrada.idempotencyKey,
      },
    })
    return 'creado'
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'duplicado'
    }
    console.error('[analitica] no se pudo reservar el aviso', {
      tipo: entrada.tipo,
      error: error instanceof Error ? error.message : 'desconocido',
    })
    return 'error'
  }
}
