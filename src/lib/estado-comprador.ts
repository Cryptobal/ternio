import { EstadoCompraLead, EstadoLead } from '@prisma/client'

import type { CampoFormulario } from '@/lib/campos'

export type ResumenCotizacionComprador = {
  estado: string
  siguiente?: string
}

export type LineaRecapComprador = {
  etiqueta: string
  valor: string
}

const CLAVES_PII = new Set([
  'nombre',
  'nombrecontacto',
  'email',
  'correo',
  'telefono',
  'telefonoe164',
  'rut',
  'rutnormalizado',
  'razonsocial',
  'detalle',
  'contacto',
])

/**
 * Estado honesto + próximo paso. Sin propuestas inventadas ni “te van a contactar”.
 */
export function resumenCotizacionComprador(lead: {
  estado: EstadoLead
  rutValido: boolean
  telefonoVerificado: boolean
}): ResumenCotizacionComprador {
  if (lead.estado === EstadoLead.DESCARTADO) {
    return { estado: 'No pudimos continuar con esta solicitud' }
  }
  if (lead.estado === EstadoLead.ARCHIVADO) {
    return { estado: 'Solicitud cerrada' }
  }

  if (!lead.telefonoVerificado) {
    return {
      estado: 'Recibimos tu solicitud',
      siguiente: 'Confirma el teléfono con el código que te enviamos. Después no lo volvemos a pedir.',
    }
  }

  if (lead.estado === EstadoLead.LISTA_ESPERA) {
    return {
      estado: 'Quedó en lista de espera',
      siguiente: 'Este servicio todavía no tiene empresas en Ternio. Te avisamos cuando se abra.',
    }
  }

  if (lead.estado === EstadoLead.VERIFICADO) {
    return { estado: 'Solicitud verificada' }
  }

  return {
    estado: 'Estamos revisando tus datos',
    siguiente: lead.rutValido
      ? 'Revisamos tus datos. Te avisamos si falta algo.'
      : 'Revisamos el RUT. Te avisamos si falta algo.',
  }
}

/** Solo compras PAGADA. Una reversa no cuenta como “ya tiene tus datos”. */
export function contarComprasPagadas(
  compras: ReadonlyArray<{ estado: string }>,
): number {
  return compras.filter((compra) => compra.estado === EstadoCompraLead.PAGADA).length
}

export function textoEmpresasTomaron(cantidadPagas: number): string {
  const n = Number.isFinite(cantidadPagas) ? Math.max(0, Math.floor(cantidadPagas)) : 0
  if (n === 0) return 'Todavía ninguna empresa tomó esta solicitud'
  if (n === 1) return '1 empresa ya tiene tus datos'
  return `${n} empresas ya tienen tus datos`
}

function etiquetaDesdeClave(clave: string): string {
  const limpia = clave.replace(/_/g, ' ').trim()
  if (!limpia) return clave
  return limpia.charAt(0).toUpperCase() + limpia.slice(1)
}

function etiquetaOpcion(valor: string, campo?: CampoFormulario): string {
  if (campo?.tipo === 'si_no') {
    if (valor === 'si') return 'Sí'
    if (valor === 'no') return 'No'
  }
  const opcion = campo?.opciones?.find((item) => item.valor === valor)
  return opcion?.etiqueta ?? valor
}

function valorLegible(bruto: unknown, campo?: CampoFormulario): string {
  const partes = Array.isArray(bruto)
    ? bruto.filter((item): item is string => typeof item === 'string')
    : typeof bruto === 'number'
      ? [String(bruto)]
      : typeof bruto === 'string'
        ? bruto.split(',')
        : []

  return partes
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => etiquetaOpcion(item, campo))
    .join(', ')
}

/**
 * Recap corto de `Lead.datos`. Sin PII de contacto: eso vive en LeadContacto.
 */
export function recapDatosComprador(
  datos: unknown,
  campos: CampoFormulario[] = [],
): LineaRecapComprador[] {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return []

  const porNombre = new Map(campos.map((campo) => [campo.nombre, campo]))
  const lineas: LineaRecapComprador[] = []

  for (const [clave, bruto] of Object.entries(datos as Record<string, unknown>)) {
    if (CLAVES_PII.has(clave.toLowerCase())) continue
    const campo = porNombre.get(clave)
    const valor = valorLegible(bruto, campo)
    if (!valor) continue
    lineas.push({
      etiqueta: campo?.etiqueta ?? etiquetaDesdeClave(clave),
      valor,
    })
  }

  return lineas
}
