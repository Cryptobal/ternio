import { leerSeleccionCobertura, type SeleccionCobertura } from '@/lib/cobertura'
import { errorCampoIdentidad } from '@/lib/validar-identidad'

export type DatosCuentaProveedor = {
  nombreEmpresa: string
  rut: string
  telefono: string
  email: string
  rubros: string[]
  cobertura: SeleccionCobertura
}

export function validarCuentaProveedor(entrada: {
  nombreEmpresa?: unknown
  rut?: unknown
  telefono?: unknown
  email?: unknown
  rubros?: unknown
  modoCobertura?: unknown
  regiones?: unknown
  provincias?: unknown
  comunas?: unknown
}): { ok: true; datos: DatosCuentaProveedor } | { ok: false; errores: Record<string, string> } {
  const nombreEmpresa = typeof entrada.nombreEmpresa === 'string' ? entrada.nombreEmpresa.trim() : ''
  const rut = typeof entrada.rut === 'string' ? entrada.rut : ''
  const telefono = typeof entrada.telefono === 'string' ? entrada.telefono : ''
  const email = typeof entrada.email === 'string' ? entrada.email : ''
  const rubros = Array.isArray(entrada.rubros)
    ? entrada.rubros.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : []

  const errores: Record<string, string> = {}
  if (!nombreEmpresa) errores.nombreEmpresa = 'Escribe el nombre de la empresa.'
  else if (nombreEmpresa.length < 2) errores.nombreEmpresa = 'El nombre de la empresa es muy corto.'
  else if (nombreEmpresa.length > 160) errores.nombreEmpresa = 'El nombre de la empresa es demasiado largo.'

  const eRut = errorCampoIdentidad('rut', rut)
  if (eRut) errores.rut = eRut
  const eTelefono = errorCampoIdentidad('telefono', telefono)
  if (eTelefono) errores.telefono = eTelefono
  const eEmail = errorCampoIdentidad('email', email)
  if (eEmail) errores.email = eEmail
  if (rubros.length === 0) errores.rubros = 'Elige al menos un rubro.'

  const cobertura = leerSeleccionCobertura({
    modo: entrada.modoCobertura,
    regiones: entrada.regiones,
    provincias: entrada.provincias,
    comunas: entrada.comunas,
  })
  if (!cobertura.ok) errores.cobertura = cobertura.error

  if (Object.keys(errores).length > 0 || !cobertura.ok) return { ok: false, errores }

  return {
    ok: true,
    datos: {
      nombreEmpresa,
      rut,
      telefono,
      email: email.trim().toLowerCase(),
      rubros,
      cobertura: cobertura.datos,
    },
  }
}
