/**
 * Envío de SMS sin SDK: fetch contra la API REST de Twilio.
 *
 * Fail-closed en producción: sin credenciales no se envía ni se finge.
 * En desarrollo el mensaje (con el código) se imprime solo en el log local.
 */

export type ResultadoSms = { ok: true } | { ok: false; motivo: string }

export function smsConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM,
  )
}

export async function enviarSms(telefonoE164: string, mensaje: string): Promise<ResultadoSms> {
  if (smsConfigurado()) {
    const sid = process.env.TWILIO_ACCOUNT_SID as string
    const token = process.env.TWILIO_AUTH_TOKEN as string
    const from = process.env.TWILIO_FROM as string
    const cuerpo = new URLSearchParams({ To: telefonoE164, From: from, Body: mensaje })

    const respuesta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: cuerpo,
    })

    if (!respuesta.ok) {
      console.error('[sms] Twilio rechazó el envío', respuesta.status)
      return { ok: false, motivo: 'no pudimos enviarte el código, reintenta' }
    }

    return { ok: true }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[sms] sin credenciales de Twilio en producción; envío bloqueado.')
    return { ok: false, motivo: 'no pudimos enviarte el código, reintenta' }
  }

  console.info('[sms] desarrollo sin Twilio; mensaje no enviado a la red:', mensaje)
  return { ok: true }
}
