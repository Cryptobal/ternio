/**
 * Campo trampa antifraude. Se queda en el DOM para los bots; las personas
 * no lo ven (sr-only + aria-hidden). El label no es copy visible.
 */
export function CampoHoneypot({
  id = 'sitio_web',
  name = 'sitio_web',
}: {
  id?: string
  name?: string
}) {
  return (
    <div className="sr-only" aria-hidden="true">
      <label htmlFor={id}>Sitio web</label>
      <input id={id} name={name} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}
