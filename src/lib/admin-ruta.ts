/**
 * Decisión de acceso al panel de admin.
 *
 * La URL oculta (ADMIN_PATH) es cosmética: sirve para que el panel no aparezca
 * por curiosidad ni en logs de terceros. La seguridad real es el rol ADMIN
 * validado en servidor. Por eso cualquier caso que no sea "ruta secreta + rol
 * ADMIN" responde 404, nunca 401 ni un redirect: no confirmamos que exista.
 *
 * Función pura para poder probarla sin levantar Next.
 */

export const SUBRUTA_LOGIN_ADMIN = 'ingresar'

export type DecisionAdmin =
  /** No es una ruta de admin: sigue el flujo normal del sitio. */
  | 'ignorar'
  /** Responde 404 sin revelar nada. */
  | 'no-encontrado'
  /** Deja pasar al panel (el rol se vuelve a validar en el servidor). */
  | 'permitir'

export type EntradaDecisionAdmin = {
  pathname: string
  /** Valor de ADMIN_PATH; vacío o ausente deja el panel inalcanzable. */
  adminPath: string | undefined | null
  /** true solo si la sesión del servidor tiene rol ADMIN. */
  esAdmin: boolean
}

function normalizarSegmento(valor: string | undefined | null): string {
  return (valor ?? '').replace(/^\/+|\/+$/g, '')
}

function estaBajo(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function decidirAccesoAdmin({
  pathname,
  adminPath,
  esAdmin,
}: EntradaDecisionAdmin): DecisionAdmin {
  // El acceso directo a /admin/* nunca es legítimo: el panel solo se sirve
  // por rewrite desde la ruta secreta.
  if (estaBajo(pathname, '/admin')) return 'no-encontrado'

  const segmento = normalizarSegmento(adminPath)
  if (!segmento) return 'ignorar'

  const base = `/${segmento}`
  if (!estaBajo(pathname, base)) return 'ignorar'

  // La pantalla de login tiene que ser alcanzable sin sesión; si no, nadie
  // podría entrar nunca.
  if (pathname === `${base}/${SUBRUTA_LOGIN_ADMIN}`) return 'permitir'

  return esAdmin ? 'permitir' : 'no-encontrado'
}

/** URL pública del panel (solo para uso interno del servidor, nunca en links). */
export function rutaAdmin(subruta = ''): string {
  const segmento = normalizarSegmento(process.env.ADMIN_PATH)
  if (!segmento) return '/'
  const limpia = subruta.replace(/^\/+/, '')
  return limpia ? `/${segmento}/${limpia}` : `/${segmento}`
}
