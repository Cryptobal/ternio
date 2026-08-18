/**
 * Acceso al panel de admin.
 *
 * La URL es fija en /admin. No aparece en el sitio, ni en el sitemap, ni en
 * robots.txt (listarla ahí la revelaría). Esa URL es cosmética: la seguridad
 * real es el rol ADMIN validado en servidor. Cualquier caso que no sea
 * "ruta /admin + rol ADMIN" responde 404, nunca 401 ni un redirect: no
 * confirmamos que exista.
 *
 * Función pura para poder probarla sin levantar Next.
 */

export const RUTA_ADMIN = '/admin'
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
  /** true solo si la sesión del servidor tiene rol ADMIN. */
  esAdmin: boolean
}

function estaBajo(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function decidirAccesoAdmin({
  pathname,
  esAdmin,
}: EntradaDecisionAdmin): DecisionAdmin {
  if (!estaBajo(pathname, RUTA_ADMIN)) return 'ignorar'

  // La pantalla de login tiene que ser alcanzable sin sesión; si no, nadie
  // podría entrar nunca.
  if (pathname === `${RUTA_ADMIN}/${SUBRUTA_LOGIN_ADMIN}`) return 'permitir'

  return esAdmin ? 'permitir' : 'no-encontrado'
}

/** URL del panel (solo para uso interno del servidor, nunca en links públicos). */
export function rutaAdmin(subruta = ''): string {
  const limpia = subruta.replace(/^\/+/, '')
  return limpia ? `${RUTA_ADMIN}/${limpia}` : RUTA_ADMIN
}
