import { idContenedorGtm, urlNoscriptGtm } from '@/lib/gtm'

/**
 * Parte 2 del snippet oficial de GTM: <noscript><iframe> justo después
 * de abrir <body>. El <script> de head vive en el layout raíz: Next exige
 * `beforeInteractive` ahí (no en un componente anidado).
 *
 * No hay aviso de cookies / Rastro en el código hoy: GTM se carga sin
 * gate. Si más adelante hay consentimiento, este componente y el script
 * del layout son el punto para respetarlo.
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
