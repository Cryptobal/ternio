import { EstadoLead, ModoRubro } from '@prisma/client'

import { audienciasDe } from '@/lib/audiencia'

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
  precioExclusivoHogarClp?: number | null
  precioCompartidoHogarClp?: number | null
  audiencias?: readonly string[] | null
}

/**
 * Un rubro en CAPTURA nunca vende: publica páginas y acumula demanda en lista
 * de espera. Solo VENTA (con precios cargados por cada audiencia) habilita
 * la oferta a proveedores.
 */
export function rubroPuedeVender(rubro: RubroConPrecios): boolean {
  if (!rubro.activo || rubro.modo !== ModoRubro.VENTA) return false
  return validarModoRubro(rubro).ok
}

export type ResultadoValidacionModo =
  | { ok: true }
  | { ok: false; motivo: string }

/**
 * Pasar un rubro a VENTA exige precios > 0 para cada audiencia declarada.
 */
export function validarModoRubro(rubro: RubroConPrecios): ResultadoValidacionModo {
  if (rubro.modo !== ModoRubro.VENTA) return { ok: true }

  const audiencias = audienciasDe(rubro.audiencias)

  if (audiencias.includes('empresa')) {
    if ((rubro.precioExclusivoClp ?? 0) <= 0) {
      return { ok: false, motivo: 'Para pasar a VENTA necesitas un precio exclusivo de empresa mayor a $0.' }
    }
    if ((rubro.precioCompartidoClp ?? 0) <= 0) {
      return { ok: false, motivo: 'Para pasar a VENTA necesitas un precio compartido de empresa mayor a $0.' }
    }
  }

  if (audiencias.includes('hogar')) {
    if ((rubro.precioExclusivoHogarClp ?? 0) <= 0) {
      return {
        ok: false,
        motivo:
          'Este rubro atiende hogar: carga precio exclusivo de hogar mayor a $0 (si no, esos leads no se venden).',
      }
    }
    if ((rubro.precioCompartidoHogarClp ?? 0) <= 0) {
      return {
        ok: false,
        motivo:
          'Este rubro atiende hogar: carga precio compartido de hogar mayor a $0 (si no, esos leads no se venden).',
      }
    }
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

/** Texto honesto en tus cotizaciones; nunca jerga interna ni marketplace. */
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
