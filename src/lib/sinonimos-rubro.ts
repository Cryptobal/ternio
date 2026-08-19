/**
 * Términos de búsqueda chilenos → rubro canónico.
 * No crea URLs: solo typeahead del cotizador y del catálogo.
 */

import { SLUG_PUBLICO_A_BD } from '@/lib/seo-rutas'
import { slugificarNombre } from '@/lib/territorio'

export const SINONIMOS_RUBRO: Record<string, readonly string[]> = {
  seguridad: [
    'guardia',
    'guardias',
    'guarda',
    'guardas',
    'guardia de seguridad',
    'guarda de seguridad',
    'empresa de seguridad',
    'seguridad privada',
  ],
  aseo: ['aseo industrial', 'aseo de oficinas', 'limpieza de oficinas', 'empresa de aseo'],
  'aseo-hogar': [
    'nana',
    'nanas',
    'nana casa',
    'aseo a domicilio',
    'aseo domicilio',
    'asesora del hogar',
    'empleada domestica',
    'limpieza casa',
  ],
  destape: ['alcantarillado', 'alcantarilla', 'destape wc', 'wc tapado', 'camara'],
  gasfiteria: ['gasfiter', 'gasfiteres', 'plomero', 'caneria', 'cañeria'],
  electricista: ['electricistas', 'electrico'],
  pintura: ['pintor', 'pintores'],
  remodelaciones: ['maestro', 'maestro de obras', 'obras menores'],
  cerrajeria: ['cerrajero', 'cerrajeros', 'llave', 'puerta trabada'],
  'tecnico-electrodomesticos': ['tecnico', 'refrigerador', 'lavadora'],
  mudanzas: ['mudanza', 'flete', 'fletes'],
  jardineria: ['jardinero', 'jardineros', 'podador'],
  'cuidado-adulto-mayor': ['cuidadora', 'cuidador', 'adulto mayor'],
  'control-de-plagas': ['plagas', 'fumigacion', 'ratones', 'cucarachas'],
  'banos-quimicos': ['bano quimico', 'wc quimico'],
  generadores: ['generador', 'arriendo generador'],
  'transporte-de-personal': ['buses de personal', 'minibus empresa'],
  'transporte-de-carga': ['transporte carga', 'camion'],
  'climatizacion-industrial': ['climatizacion', 'aire acondicionado industrial'],
  contabilidad: ['contador', 'contadores'],
  'marketing-digital': ['marketing', 'community manager'],
  abogados: ['abogado', 'estudio juridico'],
  reclutamiento: ['headhunter', 'seleccion de personal'],
  'asesoria-financiera': ['creditos', 'credito pyme', 'asesor financiero'],
  seguros: ['seguro', 'corredor de seguros'],
}

function aliasesPublicosDe(slugBd: string): string[] {
  return Object.entries(SLUG_PUBLICO_A_BD)
    .filter(([, destino]) => destino === slugBd)
    .map(([alias]) => alias.replaceAll('-', ' '))
}

export function textoBusquedaRubro(rubro: {
  slug: string
  nombre: string
  nombrePlural?: string | null
}): string {
  const extras = SINONIMOS_RUBRO[rubro.slug] ?? []
  return slugificarNombre(
    [rubro.nombre, rubro.nombrePlural ?? '', rubro.slug, ...extras, ...aliasesPublicosDe(rubro.slug)].join(
      ' ',
    ),
  )
}
