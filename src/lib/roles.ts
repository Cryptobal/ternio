/**
 * Roles de usuario alineados con el enum Prisma `RolUsuario`.
 *
 * Viven en un módulo sin `@prisma/client` a propósito: el middleware de Next.js
 * corre en Edge Runtime y cualquier import de valor desde `@prisma/client`
 * (incluso solo un enum) hace fallar el deploy en Vercel con
 * "Edge Function is referencing unsupported modules: .prisma", aunque
 * `next build` pase en local.
 *
 * El destino tras login ya no usa el escalar `rol`: usa capacidades
 * (`destinoPorCapacidades` / `destinoTrasLogin`).
 */
import {
  destinoPorCapacidades,
  type CapacidadesUsuario,
  type DestinoPostLogin,
} from '@/lib/capacidades'

export const ROLES = {
  COMPRADOR: 'COMPRADOR',
  PROVEEDOR: 'PROVEEDOR',
  ADMIN: 'ADMIN',
} as const

export type Rol = (typeof ROLES)[keyof typeof ROLES]

export type { CapacidadesUsuario, DestinoPostLogin }

/** Destino post-login por capacidades (cotizaciones / perfil proveedor / admin). */
export function destinoTrasLogin(caps: CapacidadesUsuario): DestinoPostLogin {
  return destinoPorCapacidades(caps)
}
