/**
 * Destino tras login según capacidades reales (cotizaciones / perfil proveedor),
 * no según el escalar `User.rol`.
 *
 * Sin `@prisma/client`: el middleware corre en Edge y cualquier import de valor
 * desde Prisma tumba el deploy (mismo motivo que `src/lib/roles.ts`).
 */

export type CapacidadesUsuario = {
  tieneCotizaciones: boolean
  tienePerfilProveedor: boolean
  esAdmin?: boolean
}

export type DestinoPostLogin =
  | '/mis-cotizaciones'
  | '/panel'
  | '/elegir'
  | '/admin'

export function destinoPorCapacidades(caps: CapacidadesUsuario): DestinoPostLogin {
  if (caps.esAdmin) return '/admin'
  if (caps.tieneCotizaciones && caps.tienePerfilProveedor) return '/elegir'
  if (caps.tienePerfilProveedor) return '/panel'
  return '/mis-cotizaciones'
}
