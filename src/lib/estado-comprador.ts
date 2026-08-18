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
  'rut',
  'rutnormalizado',
  'telefono',
  'telefonoe164',
  'email',
  'correo',
  'razonsocial',
  'razon_social',
  'nombrecontacto',
  'nombre_contacto',
  'detalle',
])

function claveNormalizada(clave: string): string {
  return clave.toLowerCase().replace(/[\s-]/g, '')
}

function textoValor(bruto: unknown): string {
  if (typeof bruto === 'string') return bruto.trim()
  if (typeof bruto === 'number' && Number.isFinite(bruto)) return String(bruto)
  if (Array.isArray(bruto)) {
    return bruto
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join(',')
  }
  return ''
}

function etiquetaDesdeClave(clave: string): string {
  const limpia = clave.replace(/_/g, ' ').trim()
  if (!limpia) return clave
  return limpia.charAt(0).toUpperCase() + limpia.slice(1)
}

function etiquetaValor(campo: CampoFormulario | undefined, valor: string): string {
  if (valor === 'si') return 'Sí'
  if (valor === 'no') return 'No'
  if (!campo?.opciones?.length) return valor
  return valor
    .split(',')
    .map((item) => campo.opciones?.find((opcion) => opcion.valor === item)?.etiqueta ?? item)
    .join(', ')
}

/** Recap de `Lead.datos` para el comprador. Nunca PII de contacto. */
export function recapDatosComprador(
  datos: unknown,
  campos: CampoFormulario[] = [],
): LineaRecapComprador[] {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return []
  const porNombre = new Map(campos.map((campo) => [campo.nombre, campo]))
  const lineas: LineaRecapComprador[] = []

  for (const [clave, bruto] of Object.entries(datos as Record<string, unknown>)) {
    if (CLAVES_PII.has(claveNormalizada(clave))) continue
    const texto = textoValor(bruto)
    if (!texto) continue
    const campo = porNombre.get(clave)
    lineas.push({
      etiqueta: campo?.etiqueta ?? etiquetaDesdeClave(clave),
      valor: etiquetaValor(campo, texto),
    })
  }

  return lineas
}

/** Solo `CompraLead` PAGADA. Una reversa no cuenta. */
export function contarComprasPagadas(
  compras: readonly { estado: string | EstadoCompraLead }[],
): number {
  return compras.filter((compra) => compra.estado === EstadoCompraLead.PAGADA).length
}

export function textoEmpresasTomaron(comprasPagadas: number): string {
  const n = Number.isFinite(comprasPagadas) ? Math.max(0, Math.trunc(comprasPagadas)) : 0
  if (n <= 0) return 'Todavía ninguna empresa tomó esta solicitud'
  if (n === 1) return '1 empresa ya tiene tus datos'
  return `${n} empresas ya tienen tus datos`
}

/**
 * Estado honesto + próximo paso. Sin “te van a contactar 5”.
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
