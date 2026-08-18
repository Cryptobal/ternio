import 'server-only'

import { prisma } from '@/lib/prisma'

/**
 * Lecturas del catálogo público (rubros, comunas y sus combinaciones).
 *
 * Durante el build no siempre hay base de datos disponible (por ejemplo, un
 * build de CI sin DATABASE_URL). Estas lecturas degradan a lista vacía en vez
 * de romper el build: las páginas se generan igual bajo demanda con ISR.
 */
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
  return tolerandoSinBase(
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
        },
      }),
    [],
  )
}

/** Rubros públicos con sus comunas activas, para el selector de la home. */
export async function rubrosConComunas() {
  return tolerandoSinBase(
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
          comunas: {
            where: { activa: true, comuna: { activa: true } },
            orderBy: { comuna: { orden: 'asc' } },
            select: { comuna: { select: { slug: true, nombre: true } } },
          },
        },
      }),
    [],
  )
}

export async function comunasActivas() {
  return tolerandoSinBase(
    () =>
      prisma.comuna.findMany({
        where: { activa: true },
        orderBy: { orden: 'asc' },
        select: { slug: true, nombre: true, region: true },
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
      rubro: { slug: rubroSlug, activo: true },
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
          precioExclusivoClp: true,
          precioCompartidoClp: true,
          camposFormulario: true,
          contenidoSeo: true,
        },
      },
      comuna: { select: { id: true, slug: true, nombre: true, region: true } },
    },
  })

  return fila
}
