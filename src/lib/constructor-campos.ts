import {
  MAX_CAMPOS_MODULO,
  campoFormularioSchema,
  camposFormularioSchema,
  type CampoFormulario,
  type TipoCampo,
} from '@/lib/campos'
import { slugificarNombre } from '@/lib/territorio'

const REGEX_NOMBRE = /^[a-z][a-z0-9_]*$/

export function tipoUsaOpciones(tipo: TipoCampo): boolean {
  return tipo === 'select' || tipo === 'radio' || tipo === 'opcion_multiple'
}

export function tipoUsaPlaceholder(tipo: TipoCampo): boolean {
  return tipo === 'texto' || tipo === 'textarea' || tipo === 'numero'
}

/** Minúsculas, sin tildes, espacios/guiones → `_`. Vacío si no queda nada usable. */
export function slugCampoDesdeEtiqueta(etiqueta: string): string {
  const conGuion = slugificarNombre(etiqueta)
  const base = conGuion.replace(/-/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  if (!base || !REGEX_NOMBRE.test(base)) {
    // Si empieza con número, prefijar no ayuda al regex; devolver vacío → campo_N
    const solo = base.replace(/[^a-z0-9_]/g, '')
    if (solo && REGEX_NOMBRE.test(solo)) return solo.slice(0, 64)
    return ''
  }
  return base.slice(0, 64)
}

function sufijarUnico(base: string, existentes: ReadonlySet<string>, maxLen: number): string {
  if (!existentes.has(base)) return base
  let i = 2
  while (i < 10_000) {
    const sufijo = `_${i}`
    const recorte = Math.max(1, maxLen - sufijo.length)
    let candidato = `${base.slice(0, recorte)}${sufijo}`
    if (!REGEX_NOMBRE.test(candidato)) {
      candidato = `campo${sufijo}`.slice(0, maxLen)
    }
    if (!existentes.has(candidato)) return candidato
    i += 1
  }
  return `campo_${Date.now()}`.slice(0, maxLen)
}

/**
 * Propone `nombre` interno desde la etiqueta. Colisiones → `_2`, `_3`…
 * Solo signos / vacío → `campo_1`, `campo_2`…
 */
export function nombreSugerido(etiqueta: string, existentes: readonly string[]): string {
  const usados = new Set(existentes.filter(Boolean))
  const base = slugCampoDesdeEtiqueta(etiqueta)
  if (!base) {
    let i = 1
    while (usados.has(`campo_${i}`)) i += 1
    return `campo_${i}`.slice(0, 64)
  }
  return sufijarUnico(base, usados, 64)
}

/** Valor interno de una opción (máx. 80), con colisiones `_2`. */
export function valorSugerido(etiqueta: string, existentes: readonly string[]): string {
  const usados = new Set(existentes.filter(Boolean))
  const base = slugCampoDesdeEtiqueta(etiqueta) || 'opcion'
  return sufijarUnico(base.slice(0, 80), usados, 80)
}

export function puedeAgregar(campos: readonly unknown[]): boolean {
  return campos.length < MAX_CAMPOS_MODULO
}

export function mover(
  campos: CampoFormulario[],
  indice: number,
  direccion: 'arriba' | 'abajo',
): CampoFormulario[] {
  const destino = direccion === 'arriba' ? indice - 1 : indice + 1
  if (indice < 0 || indice >= campos.length) return campos
  if (destino < 0 || destino >= campos.length) return campos
  const copia = [...campos]
  const [item] = copia.splice(indice, 1)
  if (!item) return campos
  copia.splice(destino, 0, item)
  return copia
}

export function duplicar(campos: CampoFormulario[], indice: number): CampoFormulario[] {
  if (!puedeAgregar(campos)) return campos
  const original = campos[indice]
  if (!original) return campos
  const nombres = campos.map((c) => c.nombre)
  const copia: CampoFormulario = {
    ...original,
    nombre: nombreSugerido(original.etiqueta || original.nombre, nombres),
    opciones: original.opciones?.map((op) => ({ ...op })),
  }
  const siguiente = [...campos]
  siguiente.splice(indice + 1, 0, copia)
  return siguiente
}

/** Nombres que aparecen más de una vez (para marcar el segundo en adelante). */
export function nombresDuplicados(campos: readonly { nombre: string }[]): Set<string> {
  const vistos = new Set<string>()
  const dupes = new Set<string>()
  for (const c of campos) {
    const n = c.nombre.trim()
    if (!n) continue
    if (vistos.has(n)) dupes.add(n)
    else vistos.add(n)
  }
  return dupes
}

export function campoVacio(existentes: readonly string[]): CampoFormulario {
  return {
    nombre: nombreSugerido('Nueva pregunta', existentes),
    etiqueta: '',
    tipo: 'texto',
    requerido: false,
  }
}

/** Quita opciones / placeholder que el tipo no usa (para persistir / submit). */
export function limpiarCampoParaPersistir(campo: CampoFormulario): CampoFormulario {
  const limpio: CampoFormulario = {
    nombre: campo.nombre,
    etiqueta: campo.etiqueta,
    tipo: campo.tipo,
    requerido: Boolean(campo.requerido),
  }
  if (campo.ayuda?.trim()) limpio.ayuda = campo.ayuda.trim().slice(0, 240)
  if (tipoUsaPlaceholder(campo.tipo) && campo.placeholder?.trim()) {
    limpio.placeholder = campo.placeholder.trim().slice(0, 120)
  }
  if (tipoUsaOpciones(campo.tipo) && campo.opciones?.length) {
    limpio.opciones = campo.opciones
      .filter((op) => op.etiqueta.trim() || op.valor.trim())
      .map((op) => ({
        valor: op.valor.trim().slice(0, 80),
        etiqueta: op.etiqueta.trim().slice(0, 160),
      }))
  }
  return limpio
}

export function serializarCamposConstructor(campos: CampoFormulario[]): string {
  return JSON.stringify(campos.map(limpiarCampoParaPersistir), null, 2)
}

export type ErrorCampoConstructor = {
  nombre?: string
  etiqueta?: string
  opciones?: string
  general?: string
}

/** Validación en vivo alineada al schema (sin fallar por campos a medio llenar en vacío). */
export function validarCamposConstructor(campos: CampoFormulario[]): {
  ok: boolean
  exceso: boolean
  errores: ErrorCampoConstructor[]
  dupes: Set<string>
} {
  const exceso = campos.length > MAX_CAMPOS_MODULO
  const dupes = nombresDuplicados(campos)
  const errores: ErrorCampoConstructor[] = campos.map(() => ({}))

  if (exceso) {
    return {
      ok: false,
      exceso: true,
      errores,
      dupes,
    }
  }

  let ok = true
  campos.forEach((campo, i) => {
    const err: ErrorCampoConstructor = {}
    if (!campo.etiqueta.trim()) {
      err.etiqueta = 'Escribe la etiqueta.'
      ok = false
    } else if (campo.etiqueta.length > 160) {
      err.etiqueta = 'Máximo 160 caracteres.'
      ok = false
    }

    if (!campo.nombre.trim()) {
      err.nombre = 'Falta el nombre interno.'
      ok = false
    } else if (!REGEX_NOMBRE.test(campo.nombre) || campo.nombre.length > 64) {
      err.nombre = 'Minúsculas, números y guion bajo; empieza con letra.'
      ok = false
    } else if (dupes.has(campo.nombre)) {
      err.nombre = 'Este nombre ya está en otra pregunta.'
      ok = false
    }

    if (tipoUsaOpciones(campo.tipo)) {
      const ops = campo.opciones ?? []
      if (ops.length === 0) {
        err.opciones = 'Agrega al menos una opción.'
        ok = false
      } else if (ops.some((op) => !op.etiqueta.trim())) {
        err.opciones = 'Cada opción necesita etiqueta.'
        ok = false
      } else if (ops.some((op) => !op.valor.trim())) {
        err.opciones = 'Cada opción necesita valor interno.'
        ok = false
      }
    }

    const parseo = campoFormularioSchema.safeParse(limpiarCampoParaPersistir(campo))
    if (!parseo.success && !err.nombre && !err.etiqueta && !err.opciones) {
      err.general = 'Revisa este campo.'
      ok = false
    }

    errores[i] = err
  })

  return { ok, exceso, errores, dupes }
}

export type DiagnosticoCamposAlmacenados =
  | { estado: 'ok'; campos: CampoFormulario[]; json: string }
  | {
      estado: 'invalido'
      motivo: 'schema' | 'exceso'
      campos: CampoFormulario[]
      json: string
    }

/**
 * Lee el JSON guardado para el admin. Si es inválido o >6, marca aviso
 * pero intenta cargar lo que se pueda en el constructor.
 */
export function diagnosticoCamposAlmacenados(raw: unknown): DiagnosticoCamposAlmacenados {
  let json = '[]'
  try {
    json = JSON.stringify(raw ?? [], null, 2)
  } catch {
    json = '[]'
  }

  if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
    return { estado: 'ok', campos: [], json: '[]' }
  }

  const parseo = camposFormularioSchema.safeParse(raw)
  if (!parseo.success) {
    return {
      estado: 'invalido',
      motivo: 'schema',
      campos: [],
      json,
    }
  }

  if (parseo.data.length > MAX_CAMPOS_MODULO) {
    return {
      estado: 'invalido',
      motivo: 'exceso',
      campos: parseo.data,
      json,
    }
  }

  return { estado: 'ok', campos: parseo.data, json }
}

export function parsearJsonConstructor(texto: string): {
  ok: true
  campos: CampoFormulario[]
} | {
  ok: false
  motivo: string
} {
  const crudo = texto.trim()
  if (crudo === '') return { ok: true, campos: [] }
  let json: unknown
  try {
    json = JSON.parse(crudo)
  } catch {
    return { ok: false, motivo: 'JSON inválido.' }
  }
  const parseo = camposFormularioSchema.safeParse(json)
  if (!parseo.success) {
    return { ok: false, motivo: 'El JSON no calza con el contrato de campos.' }
  }
  return { ok: true, campos: parseo.data }
}
