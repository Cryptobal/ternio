/**
 * Copy y helpers puros de la home: catálogo, combos destacados y FAQ.
 * Sin Prisma: la página pasa datos ya publicados.
 */

import {
  AUDIENCIAS,
  ETIQUETA_AUDIENCIA,
  audienciasDe,
  type Audiencia,
} from '@/lib/audiencia'
import type { PreguntaFaq } from '@/lib/seo-contenido'

export const FAQ_HOME: readonly PreguntaFaq[] = [
  {
    pregunta: '¿Cuánto cuesta cotizar en Ternio?',
    respuesta:
      'Nada. Quien pide la cotización no paga. Las empresas pagan créditos solo si toman el contacto.',
  },
  {
    pregunta: '¿Cuántas empresas me van a contactar?',
    respuesta:
      'Como máximo tres en la modalidad compartida. Si una empresa compra el exclusivo, la solicitud se cierra para el resto.',
  },
  {
    pregunta: '¿Mis datos se ven antes de que alguien tome el contacto?',
    respuesta:
      'No. Mientras nadie pague, las empresas solo ven una ficha anónima (servicio, comuna y señales de verificación).',
  },
  {
    pregunta: '¿Por qué piden el RUT?',
    respuesta:
      'Para comprobar que la solicitud es real. Validamos el dígito verificador; sin RUT válido la solicitud no se vende.',
  },
  {
    pregunta: '¿Tengo que confirmar el teléfono cada vez?',
    respuesta:
      'No. Confirmas el celular con un código SMS una sola vez por cuenta. Las cotizaciones siguientes con ese teléfono no lo repiten.',
  },
  {
    pregunta: '¿En qué comunas está Ternio?',
    respuesta:
      'En las comunas con página publicada, y seguimos sumando. Si tu comuna aún no aparece, cotiza igual: queda en lista de espera.',
  },
] as const

/** Tres promesas verificables bajo el hero. No son métricas internas. */
export const PROMESAS_HOME = [
  {
    titulo: 'Cotizar es gratis',
    texto:
      'Quien pide la cotización nunca paga. Pagan las empresas, y solo si toman tu contacto.',
  },
  {
    titulo: 'Hasta 3 empresas, no más',
    texto: 'Tu solicitud llega como máximo a tres. Nadie más ve tus datos.',
  },
  {
    titulo: 'Tus datos, después',
    texto:
      'Mientras nadie tome tu solicitud, las empresas solo ven servicio y comuna.',
  },
] as const

export type RubroCatalogo = {
  slug: string
  nombre: string
  audiencias: readonly string[]
}

export type EnlaceCatalogo = {
  slug: string
  nombre: string
  href: string | null
}

export type GrupoCatalogo = {
  audiencia: Audiencia
  etiqueta: string
  items: EnlaceCatalogo[]
}

export type ComboPublicado = {
  rubroSlug: string
  comunaSlug: string
  rubroNombre: string
  comunaNombre: string
}

/**
 * Agrupa rubros activos por audiencia (empresa primero).
 * `href` solo si el rubro aparece en alguna combinación publicada.
 */
export function enlacesCatalogo(
  rubros: readonly RubroCatalogo[],
  combinaciones: readonly { rubro: string; comuna: string }[],
): GrupoCatalogo[] {
  const conPagina = new Set(combinaciones.map((c) => c.rubro))
  const ordenAudiencia: Audiencia[] = ['empresa', 'hogar']

  return ordenAudiencia.map((audiencia) => {
    const items = rubros
      .filter((rubro) => audienciasDe(rubro.audiencias).includes(audiencia))
      .map((rubro) => ({
        slug: rubro.slug,
        nombre: rubro.nombre,
        href: conPagina.has(rubro.slug) ? `/${rubro.slug}` : null,
      }))
    return {
      audiencia,
      etiqueta: ETIQUETA_AUDIENCIA[audiencia],
      items,
    }
  }).filter((grupo) => grupo.items.length > 0)
}

/**
 * Hasta `max` combos publicados: seguridad primero, luego orden estable
 * (slug de rubro, slug de comuna). Solo usa la entrada recibida.
 */
export function combosDestacados(
  combinaciones: readonly ComboPublicado[],
  max: number,
): { href: string; etiqueta: string }[] {
  const ordenados = [...combinaciones].sort((a, b) => {
    const pesoA = a.rubroSlug === 'seguridad' ? 0 : 1
    const pesoB = b.rubroSlug === 'seguridad' ? 0 : 1
    if (pesoA !== pesoB) return pesoA - pesoB
    const porRubro = a.rubroSlug.localeCompare(b.rubroSlug, 'es')
    if (porRubro !== 0) return porRubro
    return a.comunaSlug.localeCompare(b.comunaSlug, 'es')
  })

  return ordenados.slice(0, Math.max(0, max)).map((combo) => ({
    href: `/${combo.rubroSlug}/${combo.comunaSlug}`,
    etiqueta: `${combo.rubroNombre} en ${combo.comunaNombre}`,
  }))
}

/** Fallback si el rubro llega sin audiencias: empresa (B2B). */
export function audienciaCatalogoFallback(audiencias: unknown): Audiencia {
  return audienciasDe(audiencias)[0] ?? 'empresa'
}

export { AUDIENCIAS, ETIQUETA_AUDIENCIA }
