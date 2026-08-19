import 'server-only'

import { prisma } from '@/lib/prisma'
import { slugsBdCandidatos } from '@/lib/seo-rutas'

/**
 * Lecturas del catálogo público (rubros, comunas y sus combinaciones).
 *
 * Durante el build no siempre hay base de datos disponible (CI sin
 * DATABASE_URL). Esas lecturas degradan a lista vacía en vez de romper el
 * build. En runtime un error se propaga: un catálogo vacío cacheado en ISR
 * dejaba la home muda aunque /seguridad/santiago funcionara.
 */
function esFaseDeBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

async function tolerandoSinBase<T>(consulta: () => Promise<T>, alternativa: T): Promise<T> {
  try {
    return await consulta()
  } catch (error) {
    console.warn(
      '[catalogo] no se pudo leer la base de datos; se usa el catálogo vacío.',
      error instanceof Error ? error.message : 'error desconocido',
    )
    return alternativa
  }
}

async function enBuildOConsulta<T>(consulta: () => Promise<T>, alternativa: T): Promise<T> {
  if (esFaseDeBuild()) return tolerandoSinBase(consulta, alternativa)
  return consulta()
}

export type CombinacionPublicada = { rubro: string; comuna: string }

export async function combinacionesPublicadas(): Promise<CombinacionPublicada[]> {
  return tolerandoSinBase(async () => {
    const filas = await prisma.rubroComuna.findMany({
      where: {
        activa: true,
        rubro: { activo: true },
        comuna: { activa: true },
      },
      select: {
        rubro: { select: { slug: true } },
        comuna: { select: { slug: true } },
      },
      orderBy: [{ rubro: { orden: 'asc' } }, { comuna: { orden: 'asc' } }],
    })

    return filas.map((fila) => ({ rubro: fila.rubro.slug, comuna: fila.comuna.slug }))
  }, [])
}

export async function rubrosActivos() {
  return enBuildOConsulta(
    () =>
      prisma.rubro.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
        select: {
          slug: true,
          nombre: true,
          nombrePlural: true,
          descripcion: true,
          modo: true,
          audiencias: true,
          precioExclusivoClp: true,
          precioCompartidoClp: true,
          precioExclusivoHogarClp: true,
          precioCompartidoHogarClp: true,
        },
      }),
    [],
  )
}

/** Rubros públicos con las comunas de páginas SEO activas. */
export async function rubrosConComunas() {
  return enBuildOConsulta(
    () =>
      prisma.rubro.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
        select: {
          slug: true,
          nombre: true,
          nombrePlural: true,
          descripcion: true,
          modo: true,
          audiencias: true,
          comunas: {
            where: { activa: true, comuna: { activa: true } },
            orderBy: { comuna: { orden: 'asc' } },
            select: { comuna: { select: { slug: true, nombre: true, region: true, provincia: true } } },
          },
        },
      }),
    [],
  )
}

/** Todas las comunas sembradas (CUT), no solo las que tienen página SEO. */
export async function comunasActivas() {
  return enBuildOConsulta(
    () =>
      prisma.comuna.findMany({
        where: { activa: true },
        orderBy: [{ region: 'asc' }, { provincia: 'asc' }, { orden: 'asc' }],
        select: { slug: true, nombre: true, region: true, provincia: true },
      }),
    [],
  )
}

/**
 * Combinación {rubro}/{comuna} con todo lo que necesita la página pública.
 * Devuelve null si el slug no existe o la combinación no está publicada:
 * la página responde 404.
 */
export async function combinacionPorSlugs(rubroSlug: string, comunaSlug: string) {
  const fila = await prisma.rubroComuna.findFirst({
    where: {
      activa: true,
      rubro: { slug: { in: slugsBdCandidatos(rubroSlug) }, activo: true },
      comuna: { slug: comunaSlug, activa: true },
    },
    select: {
      contenido: true,
      rubro: {
        select: {
          id: true,
          slug: true,
          nombre: true,
          nombrePlural: true,
          descripcion: true,
          modo: true,
          activo: true,
          audiencias: true,
          precioExclusivoClp: true,
          precioCompartidoClp: true,
          camposFormulario: true,
          contenidoSeo: true,
        },
      },
      comuna: { select: { id: true, slug: true, nombre: true, region: true, provincia: true } },
    },
  })

  return fila
}
