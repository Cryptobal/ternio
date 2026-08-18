import { Resend } from 'resend'

export const REMITENTE_EMAIL_DEFAULT = 'Ternio <avisos@ternio.cl>'

export type ResultadoEmail = {
  ok: boolean
  omitido?: boolean
}

export type MensajeEmail = {
  to: string
  subject: string
  text: string
  html?: string
  idempotencyKey?: string
}

export type ClienteEmail = {
  send: (
    mensaje: {
      from: string
      to: string[]
      subject: string
      text: string
      html?: string
    },
    opciones?: { idempotencyKey?: string },
  ) => Promise<{ data: { id: string } | null; error: { message: string } | null }>
}

export function emailHabilitado(apiKey = process.env.RESEND_API_KEY): boolean {
  return Boolean(apiKey?.trim())
}

export function remitenteEmail(from = process.env.RESEND_FROM): string {
  const valor = from?.trim()
  return valor ? valor : REMITENTE_EMAIL_DEFAULT
}

export function textoAHtml(texto: string): string {
  const escapado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const conLinks = escapado.replace(/(https:\/\/[^\s]+)/g, '<a href="$1">$1</a>')
  return `<p>${conLinks.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />')}</p>`
}

function clienteResend(apiKey: string): ClienteEmail {
  const resend = new Resend(apiKey)
  return {
    send: (mensaje, opciones) => resend.emails.send(mensaje, opciones),
  }
}

/**
 * Envío transaccional. Sin `RESEND_API_KEY` no llama a la red: loguea y sigue.
 * Nunca lanza: un aviso no puede tumbar un lead ni una toma.
 */
export async function enviarEmail(
  mensaje: MensajeEmail,
  opciones: { apiKey?: string; from?: string; cliente?: ClienteEmail } = {},
): Promise<ResultadoEmail> {
  const apiKey = opciones.apiKey ?? process.env.RESEND_API_KEY
  if (!emailHabilitado(apiKey)) {
    console.info('[email] sin RESEND_API_KEY; aviso omitido')
    return { ok: true, omitido: true }
  }

  const cliente = opciones.cliente ?? clienteResend(apiKey!.trim())

  try {
    const { error } = await cliente.send(
      {
        from: remitenteEmail(opciones.from ?? process.env.RESEND_FROM),
        to: [mensaje.to],
        subject: mensaje.subject,
        text: mensaje.text,
        html: mensaje.html ?? textoAHtml(mensaje.text),
      },
      mensaje.idempotencyKey ? { idempotencyKey: mensaje.idempotencyKey } : undefined,
    )
    if (error) {
      console.error('[email] Resend rechazó el envío', { mensaje: error.message })
      return { ok: false }
    }
    return { ok: true }
  } catch (error) {
    console.error('[email] fallo al enviar', {
      error: error instanceof Error ? error.message : 'desconocido',
    })
    return { ok: false }
  }
}
