/**
 * Contenedor de Google Tag Manager.
 *
 * El ID es público (viaja en el HTML). Se puede sobreescribir con
 * NEXT_PUBLIC_GTM_ID. Si la variable no está definida, usamos el contenedor
 * de producción que Carlos entregó. Si está vacía o no parece un ID de GTM,
 * no inyectamos nada (fail-closed): un tag roto o vacío no se publica.
 */

const CONTENEDOR_PRODUCCION = 'GTM-K3F8GGHV'
const PATRON_ID = /^GTM-[A-Z0-9]+$/

export function idContenedorGtm(): string | null {
  const crudo = process.env.NEXT_PUBLIC_GTM_ID
  const id = (crudo === undefined ? CONTENEDOR_PRODUCCION : crudo).trim()
  if (!id || !PATRON_ID.test(id)) return null
  return id
}

/** Snippet oficial de GTM para <head>. `id` ya tiene que estar validado. */
export function snippetGtm(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`
}

export function urlNoscriptGtm(id: string): string {
  return `https://www.googletagmanager.com/ns.html?id=${id}`
}
