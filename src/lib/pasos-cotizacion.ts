import { esOpcionUnica, type CampoFormulario } from '@/lib/campos'

export const TRONCO_IDENTIDAD = [
  { id: 'razonSocial', etiqueta: 'Razón social', requerido: false },
  { id: 'rut', etiqueta: 'RUT de la empresa', requerido: true },
  { id: 'nombreContacto', etiqueta: 'Tu nombre', requerido: true },
  { id: 'telefono', etiqueta: 'Teléfono', requerido: true },
  { id: 'email', etiqueta: 'Correo', requerido: true },
] as const

export type IdTronco = (typeof TRONCO_IDENTIDAD)[number]['id']

export type PasoCotizacion =
  | { tipo: 'comuna'; id: 'comuna'; etiqueta: string }
  | { tipo: 'modulo'; id: string; campo: CampoFormulario }
  | { tipo: 'tronco'; id: IdTronco; etiqueta: string; requerido: boolean }
  | { tipo: 'envio'; id: 'envio'; etiqueta: string }

export function construirPasos(
  campos: CampoFormulario[],
  opciones: { pideComuna: boolean },
): PasoCotizacion[] {
  const pasos: PasoCotizacion[] = []

  if (opciones.pideComuna) {
    pasos.push({ tipo: 'comuna', id: 'comuna', etiqueta: '¿En qué comuna?' })
  }

  for (const campo of campos) {
    pasos.push({ tipo: 'modulo', id: campo.nombre, campo })
  }

  for (const campo of TRONCO_IDENTIDAD) {
    pasos.push({
      tipo: 'tronco',
      id: campo.id,
      etiqueta: campo.etiqueta,
      requerido: campo.requerido,
    })
  }

  pasos.push({ tipo: 'envio', id: 'envio', etiqueta: 'Enviar solicitud' })
  return pasos
}

export function avanzaSoloAlElegir(paso: PasoCotizacion): boolean {
  if (paso.tipo === 'comuna') return true
  if (paso.tipo === 'modulo') return esOpcionUnica(paso.campo.tipo)
  return false
}

export type ValoresFormulario = Record<string, string | string[]>

export function valorComoTexto(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor.join(',')
  return valor ?? ''
}

/**
 * Arma el payload que viaja en el submit único, en el mismo contrato
 * que espera crearLeadAction (claves planas, opción múltiple como lista).
 */
export function payloadDesdeValores(
  valores: ValoresFormulario,
  extras: { rubro: string; comuna: string },
): Record<string, string | string[]> {
  return {
    rubro: extras.rubro,
    comuna: extras.comuna,
    ...valores,
  }
}

export function clavePaso(paso: PasoCotizacion): string {
  return paso.id
}
