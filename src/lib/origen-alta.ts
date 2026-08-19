/**
 * Origen de primer toque del alta de proveedor en /proveedores.
 * No es un CRM: un string nullable. Null = directo (sin UTM ni origen=).
 */

export const LARGO_MAX_ORIGEN_ALTA = 80

export type QueryOrigenAlta = {
  origen?: unknown
  origenAlta?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
}

function primerTexto(valor: unknown): string | null {
  if (typeof valor === 'string') return valor
  if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0]
  return null
}

export function sanitizarOrigenAlta(valor: unknown): string | null {
  const crudo = primerTexto(valor)
  if (!crudo) return null
  const limpio = crudo
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, LARGO_MAX_ORIGEN_ALTA)
  return limpio || null
}

function leerQuery(query: QueryOrigenAlta | URLSearchParams, clave: keyof QueryOrigenAlta): unknown {
  if (query instanceof URLSearchParams) return query.get(clave)
  return query[clave]
}

/**
 * Lee utm_source / utm_medium / utm_campaign, o un solo `origen=` / `origenAlta`.
 * Sin params → null (directo). No exige UTM para crear la cuenta.
 */
export function origenAltaDesdeQuery(query: QueryOrigenAlta | URLSearchParams): string | null {
  const fallback = sanitizarOrigenAlta(
    leerQuery(query, 'origen') ?? leerQuery(query, 'origenAlta'),
  )
  if (fallback) return fallback

  const partes = (['utm_source', 'utm_medium', 'utm_campaign'] as const)
    .map((clave) => sanitizarOrigenAlta(leerQuery(query, clave)))
    .filter((parte): parte is string => Boolean(parte))

  if (partes.length === 0) return null
  return sanitizarOrigenAlta(partes.join('-'))
}

export function origenAltaDesdeUrl(url: string): string | null {
  try {
    return origenAltaDesdeQuery(new URL(url, 'https://www.ternio.cl').searchParams)
  } catch {
    return null
  }
}

/** Primer toque gana. Si ya hay origen, se conserva. */
export function resolverOrigenAlta(
  existente: string | null | undefined,
  candidato: string | null | undefined,
): string | null {
  return sanitizarOrigenAlta(existente) ?? sanitizarOrigenAlta(candidato)
}

/** Parche Prisma: solo escribe si la fila aún no tiene origen. */
export function parcheOrigenAlta(
  existente: string | null | undefined,
  candidato: string | null | undefined,
): { origenAlta: string } | Record<string, never> {
  if (sanitizarOrigenAlta(existente)) return {}
  const siguiente = sanitizarOrigenAlta(candidato)
  return siguiente ? { origenAlta: siguiente } : {}
}
