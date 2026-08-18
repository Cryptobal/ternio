import {
  comunasDe,
  comunasDeRegion,
  regionesDe,
  type ComunaTerritorio,
} from '@/lib/territorio'

export const MODOS_COBERTURA = ['nacional', 'region', 'provincia', 'comuna'] as const

export type ModoCobertura = (typeof MODOS_COBERTURA)[number]

export type ProvinciaElegida = { region: string; provincia: string }

export type SeleccionCobertura = {
  modo: ModoCobertura
  regiones: string[]
  provincias: ProvinciaElegida[]
  comunas: string[]
}

export type SnapshotCoberturaProveedor = SeleccionCobertura & {
  rubros: string[]
  /** Audiencias por slug de rubro. Ausente en snapshots viejos. */
  audienciasPorRubro?: Record<string, string[]>
}

const ETIQUETA_MODO: Record<ModoCobertura, string> = {
  nacional: 'Todo Chile',
  region: 'Por región',
  provincia: 'Por provincia',
  comuna: 'Por comuna',
}

export function esModoCobertura(valor: string): valor is ModoCobertura {
  return (MODOS_COBERTURA as readonly string[]).includes(valor)
}

export function seleccionVacia(modo: ModoCobertura = 'comuna'): SeleccionCobertura {
  return { modo, regiones: [], provincias: [], comunas: [] }
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function listaTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

export function parsearProvincias(valor: unknown): ProvinciaElegida[] {
  const crudos = listaTextos(valor)
  const vistas = new Set<string>()
  const resultado: ProvinciaElegida[] = []
  for (const item of crudos) {
    const [region, provincia] = item.split('|')
    if (!region || !provincia) continue
    const clave = `${region}|${provincia}`
    if (vistas.has(clave)) continue
    vistas.add(clave)
    resultado.push({ region, provincia })
  }
  return resultado
}

export function claveProvincia(item: ProvinciaElegida): string {
  return `${item.region}|${item.provincia}`
}

export function leerSeleccionCobertura(entrada: {
  modo?: unknown
  regiones?: unknown
  provincias?: unknown
  comunas?: unknown
}): { ok: true; datos: SeleccionCobertura } | { ok: false; error: string } {
  const modoBruto = texto(entrada.modo)
  if (!esModoCobertura(modoBruto)) {
    return { ok: false, error: 'Elige cómo cubres el país.' }
  }

  const seleccion: SeleccionCobertura = {
    modo: modoBruto,
    regiones: listaTextos(entrada.regiones),
    provincias: parsearProvincias(entrada.provincias),
    comunas: listaTextos(entrada.comunas),
  }

  if (seleccion.modo === 'nacional') {
    return { ok: true, datos: { ...seleccion, regiones: [], provincias: [], comunas: [] } }
  }
  if (seleccion.modo === 'region' && seleccion.regiones.length === 0) {
    return { ok: false, error: 'Elige al menos una región.' }
  }
  if (seleccion.modo === 'provincia' && seleccion.provincias.length === 0) {
    return { ok: false, error: 'Elige al menos una provincia.' }
  }
  if (seleccion.modo === 'comuna' && seleccion.comunas.length === 0) {
    return { ok: false, error: 'Elige al menos una comuna.' }
  }

  return { ok: true, datos: seleccion }
}

export function expandirCobertura(
  comunas: ComunaTerritorio[],
  seleccion: SeleccionCobertura,
): { nacional: boolean; slugs: string[] } {
  if (seleccion.modo === 'nacional') {
    return { nacional: true, slugs: [] }
  }

  if (seleccion.modo === 'region') {
    const todas = regionesDe(comunas)
    if (todas.length > 0 && seleccion.regiones.length === todas.length) {
      return { nacional: true, slugs: [] }
    }
    const slugs = seleccion.regiones.flatMap((region) =>
      comunasDeRegion(comunas, region).map((comuna) => comuna.slug),
    )
    return { nacional: false, slugs: [...new Set(slugs)] }
  }

  if (seleccion.modo === 'provincia') {
    const slugs = seleccion.provincias.flatMap((item) =>
      comunasDe(comunas, item.region, item.provincia).map((comuna) => comuna.slug),
    )
    return { nacional: false, slugs: [...new Set(slugs)] }
  }

  return { nacional: false, slugs: [...new Set(seleccion.comunas)] }
}

export function etiquetaModoCobertura(modo: ModoCobertura): string {
  return ETIQUETA_MODO[modo]
}

export function textoCobertura(seleccion: SeleccionCobertura): string {
  if (seleccion.modo === 'nacional') return 'Todo Chile'
  if (seleccion.modo === 'region') {
    return seleccion.regiones.length > 0 ? seleccion.regiones.join(', ') : 'Por región'
  }
  if (seleccion.modo === 'provincia') {
    return seleccion.provincias.length > 0
      ? seleccion.provincias.map((item) => item.provincia).join(', ')
      : 'Por provincia'
  }
  return seleccion.comunas.length > 0
    ? `${seleccion.comunas.length} ${seleccion.comunas.length === 1 ? 'comuna' : 'comunas'}`
    : 'Por comuna'
}

export function leerSnapshotCobertura(valor: unknown): SnapshotCoberturaProveedor | null {
  if (!valor || typeof valor !== 'object') return null
  const objeto = valor as Partial<SnapshotCoberturaProveedor> & {
    audienciasPorRubro?: unknown
  }
  const modo = typeof objeto.modo === 'string' && esModoCobertura(objeto.modo) ? objeto.modo : null
  if (!modo) return null

  let audienciasPorRubro: Record<string, string[]> | undefined
  if (objeto.audienciasPorRubro && typeof objeto.audienciasPorRubro === 'object') {
    audienciasPorRubro = {}
    for (const [slug, lista] of Object.entries(objeto.audienciasPorRubro)) {
      if (!Array.isArray(lista)) continue
      const limpia = lista.filter((item): item is string => typeof item === 'string')
      if (limpia.length > 0) audienciasPorRubro[slug] = limpia
    }
    if (Object.keys(audienciasPorRubro).length === 0) audienciasPorRubro = undefined
  }

  return {
    modo,
    rubros: Array.isArray(objeto.rubros)
      ? objeto.rubros.filter((item): item is string => typeof item === 'string')
      : [],
    regiones: Array.isArray(objeto.regiones)
      ? objeto.regiones.filter((item): item is string => typeof item === 'string')
      : [],
    provincias: Array.isArray(objeto.provincias)
      ? objeto.provincias.filter((item): item is ProvinciaElegida => {
          return (
            Boolean(item) &&
            typeof item === 'object' &&
            typeof item.region === 'string' &&
            typeof item.provincia === 'string'
          )
        })
      : [],
    comunas: Array.isArray(objeto.comunas)
      ? objeto.comunas.filter((item): item is string => typeof item === 'string')
      : [],
    ...(audienciasPorRubro ? { audienciasPorRubro } : {}),
  }
}
