/**
 * Roles de usuario alineados con el enum Prisma `RolUsuario`.
 *
 * Viven en un módulo sin `@prisma/client` a propósito: el middleware de Next.js
 * corre en Edge Runtime y cualquier import de valor desde `@prisma/client`
 * (incluso solo un enum) hace fallar el deploy en Vercel con
 * "Edge Function is referencing unsupported modules: .prisma", aunque
 * `next build` pase en local.
 */
export const ROLES = {
  COMPRADOR: 'COMPRADOR',
  PROVEEDOR: 'PROVEEDOR',
  ADMIN: 'ADMIN',
} as const

export type Rol = (typeof ROLES)[keyof typeof ROLES]
