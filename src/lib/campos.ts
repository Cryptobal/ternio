import { z } from 'zod'

/**
 * Campos dinámicos del formulario de cotización.
 *
 * La definición vive en Rubro.camposFormulario (JSON en base de datos):
 * agregar un rubro o cambiar sus preguntas no toca código. Como el JSON es
 * editable desde el admin, se valida con zod cada vez que se lee.
 */

export const campoFormularioSchema = z.object({
  nombre: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, {
    message: 'El nombre del campo debe ser minúsculas, números y guion bajo.',
  }),
  etiqueta: z.string().min(1).max(160),
  tipo: z.enum(['texto', 'textarea', 'numero', 'select', 'radio']),
  requerido: z.boolean().default(false),
  ayuda: z.string().max(240).optional(),
  placeholder: z.string().max(120).optional(),
  opciones: z
    .array(z.object({ valor: z.string().min(1).max(80), etiqueta: z.string().min(1).max(160) }))
    .optional(),
})

export type CampoFormulario = z.infer<typeof campoFormularioSchema>

export const camposFormularioSchema = z.array(campoFormularioSchema)

/**
 * Lee la configuración de campos de un rubro. Si el JSON quedó mal editado,
 * devuelve lista vacía en vez de romper la página pública.
 */
export function parsearCampos(json: unknown): CampoFormulario[] {
  const resultado = camposFormularioSchema.safeParse(json)
  return resultado.success ? resultado.data : []
}

export type ValoresCampos = Record<string, string>

export type ResultadoCampos =
  | { ok: true; valores: ValoresCampos }
  | { ok: false; errores: Record<string, string> }

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
    const bruto = entrada[campo.nombre]
    const valor = typeof bruto === 'string' ? bruto.trim() : ''

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

    if ((campo.tipo === 'select' || campo.tipo === 'radio') && campo.opciones) {
      const permitido = campo.opciones.some((opcion) => opcion.valor === valor)
      if (!permitido) {
        errores[campo.nombre] = `Elige una opción válida en "${campo.etiqueta}".`
        continue
      }
    }

    valores[campo.nombre] = valor
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores }
  return { ok: true, valores }
}
