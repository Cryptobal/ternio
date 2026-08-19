import 'server-only'

import { EstadoProveedor } from '@prisma/client'

import {
  ordenarProveedoresPublicos,
  proveedorVisibleEnCombo,
  type ComboPublico,
  type ProveedorMatch,
} from '@/lib/matching'
import { pathPublicoEmpresa } from '@/lib/logo-proveedor'
import { prisma } from '@/lib/prisma'

export type ProveedorPublicoResumen = {
  slug: string
  nombre: string
  logoUrl: string | null
  descripcion: string | null
  path: string
}

function aMatch(fila: {
  estado: EstadoProveedor
  coberturaNacional: boolean
  slug: string
  solicitudEspera: unknown
  coberturas: Array<{
    activa: boolean
    rubro: { slug: string }
    comuna: { slug: string }
  }>
}): ProveedorMatch {
  return {
    estado: fila.estado,
    coberturaNacional: fila.coberturaNacional,
    slug: fila.slug,
    solicitudEspera: fila.solicitudEspera,
    coberturas: fila.coberturas.map((c) => ({
      activa: c.activa,
      rubroSlug: c.rubro.slug,
      comunaSlug: c.comuna.slug,
    })),
  }
}

/** Proveedores APROBADO visibles en un combo rubro+comuna. Fail-soft: []. */
export async function proveedoresEnCombo(
  combo: ComboPublico,
  tope = 12,
): Promise<ProveedorPublicoResumen[]> {
  try {
    const filas = await prisma.proveedor.findMany({
      where: { estado: EstadoProveedor.APROBADO },
      select: {
        slug: true,
        nombre: true,
        logoUrl: true,
        descripcion: true,
        estado: true,
        coberturaNacional: true,
        solicitudEspera: true,
        coberturas: {
          where: { activa: true },
          select: {
            activa: true,
            rubro: { select: { slug: true } },
            comuna: { select: { slug: true } },
          },
        },
      },
      take: 200,
    })

    const visibles = filas
      .filter((fila) => proveedorVisibleEnCombo(aMatch(fila), combo))
      .map((fila) => ({
        slug: fila.slug,
        nombre: fila.nombre,
        logoUrl: fila.logoUrl,
        descripcion: fila.descripcion,
        path: pathPublicoEmpresa(fila.slug),
      }))

    return ordenarProveedoresPublicos(visibles, tope)
  } catch (error) {
    console.error('[proveedores-publicos] listado combo', error)
    return []
  }
}

export async function cargarPerfilProveedorPublico(slug: string) {
  const limpio = slug.trim().toLowerCase()
  if (!limpio) return null

  try {
    return await prisma.proveedor.findFirst({
      where: { slug: limpio, estado: EstadoProveedor.APROBADO },
      select: {
        slug: true,
        nombre: true,
        logoUrl: true,
        descripcion: true,
        sitioWeb: true,
        coberturaNacional: true,
        solicitudEspera: true,
        coberturas: {
          where: { activa: true },
          select: {
            rubro: { select: { slug: true, nombre: true } },
            comuna: { select: { slug: true, nombre: true } },
          },
        },
      },
    })
  } catch (error) {
    console.error('[proveedores-publicos] perfil', error)
    return null
  }
}

/** Slugs APROBADO para el sitemap. Fail-soft: []. */
export async function pathsEmpresasSitemap(): Promise<string[]> {
  try {
    const filas = await prisma.proveedor.findMany({
      where: { estado: EstadoProveedor.APROBADO },
      select: { slug: true },
      take: 500,
      orderBy: { nombre: 'asc' },
    })
    return filas.map((fila) => pathPublicoEmpresa(fila.slug))
  } catch (error) {
    console.error('[proveedores-publicos] sitemap', error)
    return []
  }
}
