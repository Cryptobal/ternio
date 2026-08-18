import { EstadoLead, ModoRubro } from '@prisma/client'

/**
 * Reglas de negocio de los rubros. Un rubro es configuración en base de datos,
 * así que estas reglas se validan en servidor cada vez que se lee o se edita
 * un rubro — no se confía en cómo quedó la fila.
 */

export type RubroConPrecios = {
  modo: ModoRubro
  activo: boolean
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
}

/**
 * Un rubro en CAPTURA nunca vende: publica páginas y acumula demanda en lista
 * de espera. Solo VENTA (con precios cargados) habilita la oferta a proveedores.
 */
export function rubroPuedeVender(rubro: RubroConPrecios): boolean {
  return (
    rubro.activo &&
    rubro.modo === ModoRubro.VENTA &&
    (rubro.precioExclusivoClp ?? 0) > 0 &&
    (rubro.precioCompartidoClp ?? 0) > 0
  )
}

export type ResultadoValidacionModo =
  | { ok: true }
  | { ok: false; motivo: string }

/**
 * Pasar un rubro a VENTA exige ambos precios > 0. Se valida en servidor antes
 * de escribir: un rubro en VENTA sin precio sería un lead vendible a $0.
 */
export function validarModoRubro(rubro: RubroConPrecios): ResultadoValidacionModo {
  if (rubro.modo !== ModoRubro.VENTA) return { ok: true }

  if ((rubro.precioExclusivoClp ?? 0) <= 0) {
    return { ok: false, motivo: 'Para pasar a VENTA necesitas un precio exclusivo mayor a $0.' }
  }
  if ((rubro.precioCompartidoClp ?? 0) <= 0) {
    return { ok: false, motivo: 'Para pasar a VENTA necesitas un precio compartido mayor a $0.' }
  }

  return { ok: true }
}

/**
 * Estado con el que nace un lead según el modo del rubro:
 * CAPTURA → lista de espera (jamás se ofrece); VENTA → cola de revisión.
 */
export function estadoInicialLead(modo: ModoRubro): EstadoLead {
  return modo === ModoRubro.CAPTURA ? EstadoLead.LISTA_ESPERA : EstadoLead.RECIBIDO
}

/** Texto honesto para tus cotizaciones; nunca jerga interna ni “te van a contactar”. */
export function textoEstadoComprador(estado: EstadoLead): string {
  switch (estado) {
    case EstadoLead.LISTA_ESPERA:
      return 'Quedó en lista de espera'
    case EstadoLead.RECIBIDO:
    case EstadoLead.EN_REVISION:
      return 'Estamos revisando tus datos'
    case EstadoLead.VERIFICADO:
      return 'Solicitud verificada'
    case EstadoLead.DESCARTADO:
      return 'No pudimos continuar con esta solicitud'
    case EstadoLead.ARCHIVADO:
      return 'Solicitud cerrada'
  }
}
