import { z } from 'zod'

/**
 * Campos dinámicos del formulario de cotización.
 *
 * La definición vive en Rubro.camposFormulario (JSON en base de datos):
 * agregar un rubro o cambiar sus preguntas no toca código. Como el JSON es
 * editable desde el admin, se valida con zod cada vez que se lee.
 *
 * Tipos nuevos (aditivos, sin migración): opcion_multiple y si_no.
 * Los tipos previos se conservan por compatibilidad.
 */

export const TIPOS_CAMPO = [
  'texto',
  'textarea',
  'numero',
  'select',
  'radio',
  'opcion_multiple',
  'si_no',
] as const

export type TipoCampo = (typeof TIPOS_CAMPO)[number]

export const campoFormularioSchema = z.object({
  nombre: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, {
    message: 'El nombre del campo debe ser minúsculas, números y guion bajo.',
  }),
  etiqueta: z.string().min(1).max(160),
  tipo: z.enum(TIPOS_CAMPO),
  requerido: z.boolean().default(false),
  ayuda: z.string().max(240).optional(),
  placeholder: z.string().max(120).optional(),
  opciones: z
    .array(z.object({ valor: z.string().min(1).max(80), etiqueta: z.string().min(1).max(160) }))
    .optional(),
})

export type CampoFormulario = z.infer<typeof campoFormularioSchema>

export const camposFormularioSchema = z.array(campoFormularioSchema)

/** Tope del módulo del rubro (sin tronco común). Exportado para el admin. */
export const MAX_CAMPOS_MODULO = 6

/** Etiquetas legibles para el constructor del admin. */
export const TIPOS_CAMPO_ETIQUETA: Record<TipoCampo, string> = {
  texto: 'Texto corto',
  textarea: 'Texto largo',
  numero: 'Número',
  select: 'Lista desplegable',
  radio: 'Opción única',
  opcion_multiple: 'Varias opciones',
  si_no: 'Sí / No',
}

/**
 * Lee la configuración de campos de un rubro. Si el JSON quedó mal editado
 * o trae más de 6 preguntas, devuelve lista vacía (solo el tronco común)
 * y lo reporta en logs, sin PII.
 */
export function parsearCampos(json: unknown): CampoFormulario[] {
  const resultado = camposFormularioSchema.safeParse(json)
  if (!resultado.success) return []

  if (resultado.data.length > MAX_CAMPOS_MODULO) {
    console.warn(
      `[campos] el módulo del rubro trae ${resultado.data.length} preguntas; se usa solo el tronco común.`,
    )
    return []
  }

  return resultado.data
}

export type ValoresCampos = Record<string, string>

export type ResultadoCampos =
  | { ok: true; valores: ValoresCampos }
  | { ok: false; errores: Record<string, string> }

function aTexto(bruto: unknown): string {
  if (typeof bruto === 'string') return bruto.trim()
  if (Array.isArray(bruto)) {
    return bruto
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(',')
  }
  return ''
}

/**
 * Valida las respuestas contra la definición del rubro y descarta cualquier
 * clave que no esté declarada: el JSON del lead nunca guarda lo que el
 * navegador quiera mandar.
 */
export function validarValoresCampos(
  campos: CampoFormulario[],
  entrada: Record<string, unknown>,
): ResultadoCampos {
  const valores: ValoresCampos = {}
  const errores: Record<string, string> = {}

  for (const campo of campos) {
    const valor = aTexto(entrada[campo.nombre])

    if (!valor) {
      if (campo.requerido) errores[campo.nombre] = `Completa "${campo.etiqueta}".`
      continue
    }

    if (valor.length > 2000) {
      errores[campo.nombre] = `"${campo.etiqueta}" es demasiado largo.`
      continue
    }

    if (campo.tipo === 'numero' && !/^\d+([.,]\d+)?$/.test(valor)) {
      errores[campo.nombre] = `"${campo.etiqueta}" tiene que ser un número.`
      continue
    }

    if (campo.tipo === 'si_no' && valor !== 'si' && valor !== 'no') {
      errores[campo.nombre] = `Elige una opción en "${campo.etiqueta}".`
      continue
    }

    if (
      (campo.tipo === 'select' || campo.tipo === 'radio' || campo.tipo === 'opcion_multiple') &&
      campo.opciones
    ) {
      const elegidos = valor.split(',').filter(Boolean)
      const permitidos = new Set(campo.opciones.map((opcion) => opcion.valor))
      if (elegidos.length === 0 || elegidos.some((item) => !permitidos.has(item))) {
        errores[campo.nombre] = `Elige una opción válida en "${campo.etiqueta}".`
        continue
      }
    }

    valores[campo.nombre] = valor
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores }
  return { ok: true, valores }
}

export function esOpcionUnica(tipo: TipoCampo): boolean {
  return tipo === 'select' || tipo === 'radio' || tipo === 'si_no'
}
