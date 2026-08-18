import { normalizarRut } from '@/lib/rut'
import { esMovil, normalizarTelefonoE164 } from '@/lib/telefono'

/**
 * Validación del tronco de identidad del cotizador.
 * La UI y el server action usan las mismas reglas: fallar cerrado.
 */

export type IdentidadTronco = {
  razonSocial: string
  rutNormalizado: string
  nombreContacto: string
  telefonoE164: string
  email: string
}

export type ResultadoIdentidad =
  | { ok: true; datos: IdentidadTronco }
  | { ok: false; errores: Record<string, string> }

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function esCorreoValido(email: string): boolean {
  const limpio = email.trim()
  if (!limpio || limpio.length > 160) return false
  // Formato básico. Gmail y otros dominios genéricos son válidos:
  // el score puede bajarlos después; no se rechazan.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)
}

export function errorRazonSocial(valor: string): string | undefined {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe la razón social.'
  if (limpio.length < 2) return 'La razón social es muy corta.'
  if (limpio.length > 160) return 'La razón social es demasiado larga.'
  return undefined
}

export function errorRut(valor: string): string | undefined {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe el RUT de la empresa.'
  if (!normalizarRut(limpio)) {
    return 'El dígito verificador del RUT no cuadra. Revísalo e inténtalo de nuevo.'
  }
  return undefined
}

export function errorNombre(valor: string): string | undefined {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe tu nombre.'
  if (limpio.length < 2) return 'El nombre es muy corto.'
  if (limpio.length > 120) return 'El nombre es demasiado largo.'
  return undefined
}

export function errorTelefonoMovil(valor: string): string | undefined {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe tu celular.'
  const e164 = normalizarTelefonoE164(limpio)
  if (!e164 || !esMovil(e164)) {
    return 'Usa un celular chileno, por ejemplo +56 9 1234 5678.'
  }
  return undefined
}

export function errorCorreo(valor: string): string | undefined {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe tu correo.'
  if (!esCorreoValido(limpio)) return 'Revisa tu correo.'
  return undefined
}

export function errorCampoIdentidad(id: string, valor: string): string | undefined {
  switch (id) {
    case 'razonSocial':
      return errorRazonSocial(valor)
    case 'rut':
      return errorRut(valor)
    case 'nombreContacto':
      return errorNombre(valor)
    case 'telefono':
      return errorTelefonoMovil(valor)
    case 'email':
      return errorCorreo(valor)
    default:
      return undefined
  }
}

export function validarIdentidadTronco(entrada: {
  razonSocial?: unknown
  rut?: unknown
  nombreContacto?: unknown
  telefono?: unknown
  email?: unknown
}): ResultadoIdentidad {
  const razonSocial = texto(entrada.razonSocial)
  const rut = texto(entrada.rut)
  const nombreContacto = texto(entrada.nombreContacto)
  const telefono = texto(entrada.telefono)
  const email = texto(entrada.email).toLowerCase()

  const errores: Record<string, string> = {}
  const eRazon = errorRazonSocial(razonSocial)
  const eRut = errorRut(rut)
  const eNombre = errorNombre(nombreContacto)
  const eTelefono = errorTelefonoMovil(telefono)
  const eEmail = errorCorreo(email)

  if (eRazon) errores.razonSocial = eRazon
  if (eRut) errores.rut = eRut
  if (eNombre) errores.nombreContacto = eNombre
  if (eTelefono) errores.telefono = eTelefono
  if (eEmail) errores.email = eEmail

  const rutNormalizado = normalizarRut(rut)
  const telefonoE164 = normalizarTelefonoE164(telefono)

  if (Object.keys(errores).length > 0 || !rutNormalizado || !telefonoE164) {
    return { ok: false, errores }
  }

  return {
    ok: true,
    datos: {
      razonSocial,
      rutNormalizado,
      nombreContacto,
      telefonoE164,
      email,
    },
  }
}
