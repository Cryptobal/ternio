/**
 * Verificación de Cloudflare Turnstile en servidor.
 *
 * Fail-closed por diseño: si falta la clave secreta en producción, o si
 * Cloudflare no responde, la creación del lead falla con un mensaje explícito.
 * Nunca se guarda un lead "silencioso" sin pasar la verificación.
 */

const URL_VERIFICACION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type ResultadoTurnstile =
  | { ok: true }
  | { ok: false; motivo: string }

function modoTestHabilitado(): boolean {
  // El bypass solo existe fuera de producción, para tests y desarrollo local.
  return process.env.NODE_ENV !== 'production' && process.env.TURNSTILE_MODO_TEST === 'true'
}

export function turnstileConfigurado(): boolean {
  return Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY)
}

export async function verificarTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<ResultadoTurnstile> {
  if (modoTestHabilitado()) return { ok: true }

  const secreto = process.env.TURNSTILE_SECRET_KEY
  if (!secreto) {
    return {
      ok: false,
      motivo:
        'La verificación antifraude no está configurada en el servidor. ' +
        'No podemos recibir cotizaciones hasta que se resuelva.',
    }
  }

  if (!token) {
    return { ok: false, motivo: 'Completa la verificación antifraude antes de enviar.' }
  }

  const cuerpo = new URLSearchParams({ secret: secreto, response: token })
  if (ip) cuerpo.set('remoteip', ip)

  try {
    const respuesta = await fetch(URL_VERIFICACION, {
      method: 'POST',
      body: cuerpo,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
    })

    if (!respuesta.ok) {
      return { ok: false, motivo: 'No pudimos validar la verificación antifraude. Reintenta.' }
    }

    const datos = (await respuesta.json()) as { success?: boolean }
    if (datos.success !== true) {
      return { ok: false, motivo: 'La verificación antifraude no pasó. Reintenta.' }
    }

    return { ok: true }
  } catch {
    return { ok: false, motivo: 'No pudimos validar la verificación antifraude. Reintenta.' }
  }
}
