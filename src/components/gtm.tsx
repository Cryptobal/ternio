import Script from 'next/script'

import { idContenedorGtm, snippetGtm, urlNoscriptGtm } from '@/lib/gtm'

/**
 * Parte 1 del snippet oficial de GTM: el <script> lo más arriba posible
 * en <head>. `beforeInteractive` es el equivalente en App Router: Next lo
 * inyecta en el HTML inicial, dentro de <head>, antes de hidratar.
 *
 * No hay aviso de cookies / Rastro en el código hoy: GTM se carga sin
 * gate. Si más adelante hay consentimiento, este componente es el punto
 * para respetarlo.
 */
export function ScriptGtm() {
  const id = idContenedorGtm()
  if (!id) return null

  return (
    <Script
      id="google-tag-manager"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: snippetGtm(id) }}
    />
  )
}

/**
 * Parte 2 del snippet oficial: <noscript><iframe> justo después de <body>.
 */
export function NoscriptGtm() {
  const id = idContenedorGtm()
  if (!id) return null

  return (
    <noscript>
      <iframe
        src={urlNoscriptGtm(id)}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
