import 'server-only'

import { EstadoProveedor, RolUsuario } from '@prisma/client'

import {
  destinoPorCapacidades,
  type CapacidadesUsuario,
  type DestinoPostLogin,
} from '@/lib/capacidades'
import { prisma } from '@/lib/prisma'

export type CapacidadesConPerfil = CapacidadesUsuario & {
  perfilProveedorEstado: EstadoProveedor | null
}

/** Capacidades derivadas de leads y perfil Proveedor (no del escalar rol). */
export async function capacidadesDe(usuarioId: string): Promise<CapacidadesConPerfil> {
  const [usuario, cotizaciones, proveedor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: usuarioId },
      select: { rol: true },
    }),
    prisma.lead.count({ where: { compradorUsuarioId: usuarioId } }),
    prisma.proveedor.findUnique({
      where: { usuarioId },
      select: { id: true, estado: true },
    }),
  ])

  const perfilActivo =
    proveedor !== null && proveedor.estado !== EstadoProveedor.RECHAZADO

  return {
    tieneCotizaciones: cotizaciones > 0,
    tienePerfilProveedor: perfilActivo,
    esAdmin: usuario?.rol === RolUsuario.ADMIN,
    perfilProveedorEstado: proveedor?.estado ?? null,
  }
}

export async function destinoTrasLoginUsuario(
  usuarioId: string,
  opts?: { forzarMisCotizaciones?: boolean },
): Promise<DestinoPostLogin> {
  if (opts?.forzarMisCotizaciones) return '/mis-cotizaciones'
  const caps = await capacidadesDe(usuarioId)
  return destinoPorCapacidades(caps)
}
