import { ORDEN_REGIONES } from '../../prisma/comunas-chile'

export type ComunaTerritorio = {
  slug: string
  nombre: string
  region: string
  provincia: string
}

export function slugificarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ordenRegion(region: string): number {
  const indice = (ORDEN_REGIONES as readonly string[]).indexOf(region)
  return indice === -1 ? 1000 : indice
}

export function regionesDe(comunas: ComunaTerritorio[]): string[] {
  const unicas = [...new Set(comunas.map((comuna) => comuna.region).filter(Boolean))]
  return unicas.sort((a, b) => ordenRegion(a) - ordenRegion(b) || a.localeCompare(b, 'es-CL'))
}

export function provinciasDe(comunas: ComunaTerritorio[], region: string): string[] {
  const unicas = [
    ...new Set(
      comunas
        .filter((comuna) => comuna.region === region)
        .map((comuna) => comuna.provincia)
        .filter(Boolean),
    ),
  ]
  return unicas.sort((a, b) => a.localeCompare(b, 'es-CL'))
}

export function comunasDe(
  comunas: ComunaTerritorio[],
  region: string,
  provincia: string,
): ComunaTerritorio[] {
  return comunas
    .filter((comuna) => comuna.region === region && comuna.provincia === provincia)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CL'))
}

export function comunasDeRegion(comunas: ComunaTerritorio[], region: string): ComunaTerritorio[] {
  return comunas
    .filter((comuna) => comuna.region === region)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CL'))
}

export type PasoTerritorio = 'region' | 'provincia' | 'comuna' | 'listo'

/** Cascada Región → Provincia → Comuna. Sin typeahead. */
export function pasoTerritorio(region: string, provincia: string, comunaSlug = ''): PasoTerritorio {
  if (!region.trim()) return 'region'
  if (!provincia.trim()) return 'provincia'
  if (!comunaSlug.trim()) return 'comuna'
  return 'listo'
}

export type NivelListaTerritorio = 'region' | 'provincia' | 'comuna'

/**
 * Un solo nivel de chips a la vez. Nunca regiones + provincias + comunas juntas.
 * En modo múltiple (cobertura) la lista de comunas sigue visible tras la primera
 * elección para poder marcar más de una.
 */
export function nivelListaTerritorio(
  region: string,
  provincia: string,
  comunaSlug = '',
  opciones?: { multiple?: boolean },
): NivelListaTerritorio | null {
  const paso = pasoTerritorio(region, provincia, comunaSlug)
  if (paso === 'listo') return opciones?.multiple ? 'comuna' : null
  return paso
}

export function debeMostrarNivelTerritorio(
  nivel: NivelListaTerritorio,
  region: string,
  provincia: string,
  comunaSlug = '',
  opciones?: { multiple?: boolean },
): boolean {
  return nivelListaTerritorio(region, provincia, comunaSlug, opciones) === nivel
}

export function preguntaNivelTerritorio(nivel: NivelListaTerritorio): string {
  if (nivel === 'region') return '¿En qué región?'
  if (nivel === 'provincia') return '¿En qué ciudad?'
  return '¿En qué comuna?'
}

export function comunaPorSlug(
  comunas: ComunaTerritorio[],
  slug: string,
): ComunaTerritorio | undefined {
  return comunas.find((comuna) => comuna.slug === slug)
}

export function filtrarComunas(comunas: ComunaTerritorio[], busqueda: string): ComunaTerritorio[] {
  const q = slugificarNombre(busqueda.trim())
  if (!q) return []
  return comunas
    .filter((comuna) => {
      const haystack = `${slugificarNombre(comuna.nombre)} ${slugificarNombre(comuna.provincia)} ${slugificarNombre(comuna.region)} ${comuna.slug}`
      return haystack.includes(q)
    })
    .slice(0, 12)
}
