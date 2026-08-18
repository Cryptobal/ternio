import { esOpcionUnica, type CampoFormulario } from '@/lib/campos'
import { errorCampoIdentidad } from '@/lib/validar-identidad'

export const TRONCO_IDENTIDAD = [
  { id: 'razonSocial', etiqueta: 'Razón social', requerido: true },
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

export type ValoresFormulario = Record<string, string | string[]>

export function avanzaSoloAlElegir(paso: PasoCotizacion): boolean {
  if (paso.tipo === 'modulo') return esOpcionUnica(paso.campo.tipo)
  return false
}

export function esPasoOpcional(paso: PasoCotizacion): boolean {
  if (paso.tipo === 'modulo') return !paso.campo.requerido
  if (paso.tipo === 'tronco') return !paso.requerido
  return false
}

export function pasoEstaVacio(paso: PasoCotizacion, valores: ValoresFormulario): boolean {
  if (paso.tipo === 'comuna') return !valorComoTexto(valores.comuna).trim()
  if (paso.tipo === 'modulo') return !valorComoTexto(valores[paso.campo.nombre]).trim()
  if (paso.tipo === 'tronco') return !valorComoTexto(valores[paso.id]).trim()
  return false
}

/** El tronco de identidad nunca se salta: el botón no dice Saltar. */
export function etiquetaAvancePaso(
  paso: PasoCotizacion,
  valores: ValoresFormulario,
): 'Saltar' | 'Continuar' {
  if (paso.tipo === 'tronco' || paso.tipo === 'comuna') return 'Continuar'
  if (esPasoOpcional(paso) && pasoEstaVacio(paso, valores)) return 'Saltar'
  return 'Continuar'
}

export function mostrarBotonAvance(paso: PasoCotizacion, valores: ValoresFormulario): boolean {
  if (paso.tipo === 'envio') return false
  if (paso.tipo === 'modulo' && esOpcionUnica(paso.campo.tipo)) {
    return esPasoOpcional(paso) && pasoEstaVacio(paso, valores)
  }
  return true
}

export function avanceBloqueado(paso: PasoCotizacion, valores: ValoresFormulario): boolean {
  return Boolean(errorDePaso(paso, valores))
}

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

/**
 * Error inline del paso actual. Continuar no avanza si esto devuelve texto.
 * El server action vuelve a aplicar las mismas reglas del tronco.
 */
export function errorDePaso(
  paso: PasoCotizacion,
  valores: ValoresFormulario,
): string | undefined {
  if (paso.tipo === 'comuna') {
    if (!valorComoTexto(valores.comuna).trim()) return 'Elige una comuna.'
    return undefined
  }

  if (paso.tipo === 'modulo') {
    const texto = valorComoTexto(valores[paso.campo.nombre]).trim()
    if (paso.campo.requerido && !texto) {
      return `Completa "${paso.campo.etiqueta}".`
    }
    if (texto && paso.campo.tipo === 'numero' && !/^\d+([.,]\d+)?$/.test(texto)) {
      return `"${paso.campo.etiqueta}" tiene que ser un número.`
    }
    return undefined
  }

  if (paso.tipo === 'tronco') {
    return errorCampoIdentidad(paso.id, valorComoTexto(valores[paso.id]))
  }

  return undefined
}
