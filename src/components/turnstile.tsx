'use client'

import Script from 'next/script'

/**
 * Widget de Cloudflare Turnstile.
 *
 * Si no hay clave pública configurada no se dibuja nada: en desarrollo el
 * formulario sigue usable, y en producción el servidor rechaza la creación
 * del lead con un mensaje explícito (fail-closed en src/lib/turnstile.ts).
 */
export function Turnstile({ siteKey }: { siteKey: string | undefined }) {
  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-language="es" />
    </>
  )
}
