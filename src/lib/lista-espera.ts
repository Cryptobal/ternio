import { errorCampoIdentidad } from '@/lib/validar-identidad'

export type SolicitudEsperaProveedor = {
  rubros: string[]
  region: string
  provincia: string
  comunas: string[]
}

export function validarListaEspera(entrada: {
  nombreEmpresa?: unknown
  rut?: unknown
  telefono?: unknown
  email?: unknown
  rubros?: unknown
  region?: unknown
  provincia?: unknown
  comunas?: unknown
}): { ok: true; datos: DatosListaEspera } | { ok: false; errores: Record<string, string> } {
  const nombreEmpresa = typeof entrada.nombreEmpresa === 'string' ? entrada.nombreEmpresa.trim() : ''
  const rut = typeof entrada.rut === 'string' ? entrada.rut : ''
  const telefono = typeof entrada.telefono === 'string' ? entrada.telefono : ''
  const email = typeof entrada.email === 'string' ? entrada.email : ''
  const region = typeof entrada.region === 'string' ? entrada.region.trim() : ''
  const provincia = typeof entrada.provincia === 'string' ? entrada.provincia.trim() : ''
  const rubros = Array.isArray(entrada.rubros)
    ? entrada.rubros.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : []
  const comunas = Array.isArray(entrada.comunas)
    ? entrada.comunas.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
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
  if (rubros.length === 0) errores.rubros = 'Elige al menos un rubro de interés.'
  if (!region) errores.region = 'Elige una región.'
  if (!provincia) errores.provincia = 'Elige una provincia.'
  if (comunas.length === 0) errores.comunas = 'Elige al menos una comuna de cobertura.'

  if (Object.keys(errores).length > 0) return { ok: false, errores }

  return {
    ok: true,
    datos: {
      nombreEmpresa,
      rut,
      telefono,
      email: email.trim().toLowerCase(),
      rubros,
      region,
      provincia,
      comunas,
    },
  }
}

export type DatosListaEspera = {
  nombreEmpresa: string
  rut: string
  telefono: string
  email: string
  rubros: string[]
  region: string
  provincia: string
  comunas: string[]
}
