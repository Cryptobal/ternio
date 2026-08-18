import { ModoRubro } from '@prisma/client'

import {
  camposFormularioSchema,
  parsearCampos,
  type CampoFormulario,
} from '@/lib/campos'
import { validarModoRubro } from '@/lib/rubros'
import { slugificarNombre } from '@/lib/territorio'

const SLUGS_RESERVADOS = new Set([
  'admin',
  'api',
  'cotizacion',
  'entrar',
  'mis-cotizaciones',
  'panel',
  'privacidad',
  'proveedores',
  'sitemap.xml',
  'terminos',
])

export type DatosRubroEscritos = {
  slug: string
  nombre: string
  nombrePlural: string | null
  descripcion: string | null
  modo: ModoRubro
  activo: boolean
  orden: number
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
}

export type ResultadoParseoRubro =
  | { ok: true; datos: DatosRubroEscritos }
  | { ok: false; errores: Record<string, string>; motivo: string }

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function parsearPrecioClp(valor: unknown): number | null {
  const crudo = texto(valor)
  if (crudo === '') return null
  const limpio = crudo.replace(/[.\s$]/g, '').replace(',', '')
  const n = Number.parseInt(limpio, 10)
  if (!Number.isFinite(n)) return null
  return n
}

export function slugDesdeNombreRubro(nombre: string, slugExplicit?: string): string {
  const candidato = slugificarNombre(texto(slugExplicit) || nombre)
  return candidato
}

export function parsearDatosRubro(entrada: {
  nombre?: unknown
  nombrePlural?: unknown
  slug?: unknown
  descripcion?: unknown
  modo?: unknown
  activo?: unknown
  orden?: unknown
  precioExclusivoClp?: unknown
  precioCompartidoClp?: unknown
}): ResultadoParseoRubro {
  const errores: Record<string, string> = {}
  const nombre = texto(entrada.nombre)
  if (nombre.length < 2) errores.nombre = 'Escribe el nombre del rubro.'

  const slug = slugDesdeNombreRubro(nombre, texto(entrada.slug))
  if (!slug) errores.slug = 'El slug no puede quedar vacío.'
  else if (SLUGS_RESERVADOS.has(slug)) errores.slug = 'Ese slug está reservado para el sitio.'

  const modoBruto = texto(entrada.modo)
  if (modoBruto !== ModoRubro.VENTA && modoBruto !== ModoRubro.CAPTURA) {
    errores.modo = 'Elige VENTA o CAPTURA.'
  }
  const modo = modoBruto === ModoRubro.VENTA ? ModoRubro.VENTA : ModoRubro.CAPTURA

  const ordenBruto = texto(entrada.orden)
  const orden = ordenBruto === '' ? 100 : Number.parseInt(ordenBruto, 10)
  if (!Number.isInteger(orden) || orden < 0) errores.orden = 'El orden tiene que ser un número entero.'

  const activo =
    entrada.activo === true ||
    entrada.activo === 'true' ||
    entrada.activo === 'on' ||
    entrada.activo === '1'

  const precioExclusivoClp = parsearPrecioClp(entrada.precioExclusivoClp)
  const precioCompartidoClp = parsearPrecioClp(entrada.precioCompartidoClp)

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores, motivo: 'Revisa los datos marcados.' }
  }

  const datos: DatosRubroEscritos = {
    slug,
    nombre,
    nombrePlural: texto(entrada.nombrePlural) || null,
    descripcion: texto(entrada.descripcion) || null,
    modo,
    activo,
    orden: Number.isInteger(orden) ? orden : 100,
    precioExclusivoClp,
    precioCompartidoClp,
  }

  const validacion = validarModoRubro({
    modo: datos.modo,
    activo: true,
    precioExclusivoClp: datos.precioExclusivoClp,
    precioCompartidoClp: datos.precioCompartidoClp,
  })
  if (!validacion.ok) {
    if ((datos.precioExclusivoClp ?? 0) <= 0) {
      errores.precioExclusivoClp = validacion.motivo
    }
    if ((datos.precioCompartidoClp ?? 0) <= 0) {
      errores.precioCompartidoClp = validacion.motivo
    }
    return { ok: false, errores, motivo: validacion.motivo }
  }

  return { ok: true, datos }
}

export type ResultadoCamposEscritos =
  | { ok: true; campos: CampoFormulario[] }
  | { ok: false; motivo: string }

const MAX_CAMPOS_MODULO = 6

/**
 * Parseo de `camposFormulario` para el admin. Vacío = `[]` (solo tronco).
 * JSON inválido o más de 6 preguntas falla el guardado: no se usa el
 * degrade silencioso de `parsearCampos` en runtime (eso es para no romper
 * la página pública).
 */
export function parsearCamposEscritos(entrada: unknown): ResultadoCamposEscritos {
  let json: unknown = entrada

  if (entrada == null) return { ok: true, campos: [] }

  if (typeof entrada === 'string') {
    const crudo = entrada.trim()
    if (crudo === '') return { ok: true, campos: [] }
    try {
      json = JSON.parse(crudo)
    } catch {
      return { ok: false, motivo: 'El JSON de campos no es válido.' }
    }
  }

  const schema = camposFormularioSchema.safeParse(json)
  if (!schema.success) {
    return {
      ok: false,
      motivo:
        'Los campos no calzan: nombre en minúsculas, etiqueta, tipo válido y máximo 6 preguntas.',
    }
  }

  if (schema.data.length > MAX_CAMPOS_MODULO) {
    return { ok: false, motivo: 'El módulo admite como máximo 6 preguntas.' }
  }

  const campos = parsearCampos(schema.data)
  if (campos.length !== schema.data.length) {
    return { ok: false, motivo: 'Los campos del formulario no se pudieron leer.' }
  }

  return { ok: true, campos }
}

export function serializarCamposAdmin(valor: unknown): string {
  try {
    return JSON.stringify(valor ?? [], null, 2)
  } catch {
    return '[]'
  }
}
