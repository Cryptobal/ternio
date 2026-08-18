import { ModoRubro } from '@prisma/client'

import type { CampoFormulario } from '../src/lib/campos'
import { COMUNAS_CHILE } from './comunas-chile'

/**
 * Catálogo de lanzamiento: 3 rubros en VENTA (con precios) y 5 en CAPTURA
 * (sin precios, solo SEO + lista de espera). Las comunas son las 346 del CUT;
 * las páginas programáticas se publican solo para COMUNAS_SEO.
 *
 * Vive aparte del seed para poder probarlo sin base de datos.
 */

export const CAMPOS_SEGURIDAD: CampoFormulario[] = [
  {
    nombre: 'tipo_servicio',
    etiqueta: '¿Qué servicio necesitas?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'guardias', etiqueta: 'Guardias de seguridad' },
      { valor: 'control_acceso', etiqueta: 'Control de acceso' },
      { valor: 'rondas', etiqueta: 'Rondas de vigilancia' },
      { valor: 'conserjeria', etiqueta: 'Conserjería' },
      { valor: 'otro', etiqueta: 'Otro servicio de seguridad' },
    ],
  },
  {
    nombre: 'cantidad_guardias',
    etiqueta: '¿Cuántas personas necesitas?',
    tipo: 'numero',
    requerido: false,
    placeholder: 'Por ejemplo: 2',
    ayuda: 'Si no lo tienes claro, déjalo en blanco.',
  },
  {
    nombre: 'horario',
    etiqueta: '¿Con qué horario?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: '24_7', etiqueta: 'Todos los días, 24 horas' },
      { valor: 'diurno', etiqueta: 'Turno de día' },
      { valor: 'nocturno', etiqueta: 'Turno de noche' },
      { valor: 'fines_de_semana', etiqueta: 'Solo fines de semana' },
      { valor: 'por_definir', etiqueta: 'Todavía lo estoy definiendo' },
    ],
  },
  {
    nombre: 'tamano_negocio',
    etiqueta: '¿De qué tamaño es tu empresa?',
    tipo: 'select',
    requerido: false,
    opciones: [
      { valor: '1_10', etiqueta: 'Entre 1 y 10 personas' },
      { valor: '11_50', etiqueta: 'Entre 11 y 50 personas' },
      { valor: '51_200', etiqueta: 'Entre 51 y 200 personas' },
      { valor: 'mas_200', etiqueta: 'Más de 200 personas' },
    ],
  },
  {
    nombre: 'plazo',
    etiqueta: '¿Para cuándo lo necesitas?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'urgente', etiqueta: 'Lo antes posible' },
      { valor: 'este_mes', etiqueta: 'Dentro de este mes' },
      { valor: 'tres_meses', etiqueta: 'En los próximos 3 meses' },
      { valor: 'cotizando', etiqueta: 'Solo estoy cotizando' },
    ],
  },
  {
    nombre: 'detalle',
    etiqueta: 'Cuéntanos un poco más',
    tipo: 'textarea',
    requerido: false,
    placeholder: '¿Qué hay que cuidar? ¿Cuántos accesos tiene el lugar?',
  },
]

export const CAMPOS_ASEO: CampoFormulario[] = [
  {
    nombre: 'tipo_recinto',
    etiqueta: '¿Qué hay que limpiar?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'oficinas', etiqueta: 'Oficinas' },
      { valor: 'industrial', etiqueta: 'Planta o bodega industrial' },
      { valor: 'edificio', etiqueta: 'Edificio o condominio' },
      { valor: 'local', etiqueta: 'Local comercial' },
      { valor: 'otro', etiqueta: 'Otro' },
    ],
  },
  {
    nombre: 'metros_cuadrados',
    etiqueta: '¿Cuántos metros cuadrados son?',
    tipo: 'numero',
    requerido: false,
    placeholder: 'Por ejemplo: 350',
  },
  {
    nombre: 'frecuencia',
    etiqueta: '¿Cada cuánto?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'diaria', etiqueta: 'Todos los días' },
      { valor: 'semanal', etiqueta: 'Algunas veces por semana' },
      { valor: 'mensual', etiqueta: 'Una vez al mes' },
      { valor: 'puntual', etiqueta: 'Una sola vez' },
    ],
  },
  {
    nombre: 'plazo',
    etiqueta: '¿Para cuándo lo necesitas?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'urgente', etiqueta: 'Lo antes posible' },
      { valor: 'este_mes', etiqueta: 'Dentro de este mes' },
      { valor: 'cotizando', etiqueta: 'Solo estoy cotizando' },
    ],
  },
  { nombre: 'detalle', etiqueta: 'Cuéntanos un poco más', tipo: 'textarea', requerido: false },
]

export const CAMPOS_PLAGAS: CampoFormulario[] = [
  {
    nombre: 'tipo_plaga',
    etiqueta: '¿Qué plaga tienes?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'roedores', etiqueta: 'Roedores' },
      { valor: 'insectos', etiqueta: 'Insectos rastreros' },
      { valor: 'termitas', etiqueta: 'Termitas' },
      { valor: 'palomas', etiqueta: 'Palomas' },
      { valor: 'no_se', etiqueta: 'No estoy seguro' },
    ],
  },
  {
    nombre: 'tipo_recinto',
    etiqueta: '¿Dónde es?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'oficinas', etiqueta: 'Oficinas' },
      { valor: 'bodega', etiqueta: 'Bodega o planta' },
      { valor: 'restaurante', etiqueta: 'Restaurante o cocina' },
      { valor: 'edificio', etiqueta: 'Edificio o condominio' },
      { valor: 'otro', etiqueta: 'Otro' },
    ],
  },
  {
    nombre: 'plazo',
    etiqueta: '¿Para cuándo lo necesitas?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'urgente', etiqueta: 'Lo antes posible' },
      { valor: 'este_mes', etiqueta: 'Dentro de este mes' },
      { valor: 'cotizando', etiqueta: 'Solo estoy cotizando' },
    ],
  },
  { nombre: 'detalle', etiqueta: 'Cuéntanos un poco más', tipo: 'textarea', requerido: false },
]

/** Formulario genérico para los rubros que todavía están en CAPTURA. */
export const CAMPOS_CAPTURA: CampoFormulario[] = [
  {
    nombre: 'plazo',
    etiqueta: '¿Para cuándo lo necesitas?',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'urgente', etiqueta: 'Lo antes posible' },
      { valor: 'este_mes', etiqueta: 'Dentro de este mes' },
      { valor: 'tres_meses', etiqueta: 'En los próximos 3 meses' },
      { valor: 'cotizando', etiqueta: 'Solo estoy cotizando' },
    ],
  },
  {
    nombre: 'detalle',
    etiqueta: 'Cuéntanos qué necesitas',
    tipo: 'textarea',
    requerido: true,
    placeholder: 'Mientras más nos cuentes, mejor podemos buscarte proveedores.',
  },
]

export type SemillaRubro = {
  slug: string
  nombre: string
  nombrePlural: string
  descripcion: string
  modo: ModoRubro
  orden: number
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
  campos: CampoFormulario[]
  contenidoSeo: { intro: string; porQue: string }
}

export const RUBROS: SemillaRubro[] = [
  {
    slug: 'seguridad',
    nombre: 'Servicio de seguridad',
    nombrePlural: 'Empresas de seguridad',
    descripcion:
      'Guardias, control de acceso y rondas de vigilancia para empresas, edificios e industrias.',
    modo: ModoRubro.VENTA,
    orden: 1,
    precioExclusivoClp: 50_000,
    precioCompartidoClp: 20_000,
    campos: CAMPOS_SEGURIDAD,
    contenidoSeo: {
      intro:
        'Cuéntanos qué necesitas cuidar y te contactan empresas de seguridad con OS-10 vigente que trabajan en tu zona.',
      porQue:
        'Comparar sirve: el mismo turno de guardia puede variar bastante de precio entre una empresa y otra.',
    },
  },
  {
    slug: 'aseo',
    nombre: 'Servicio de aseo',
    nombrePlural: 'Empresas de aseo',
    descripcion: 'Aseo industrial, de oficinas y mantención de edificios.',
    modo: ModoRubro.VENTA,
    orden: 2,
    precioExclusivoClp: 25_000,
    precioCompartidoClp: 10_000,
    campos: CAMPOS_ASEO,
    contenidoSeo: {
      intro:
        'Cuéntanos qué hay que limpiar y con qué frecuencia, y te contactan empresas de aseo de tu zona.',
      porQue:
        'Una buena cotización de aseo depende de los metros cuadrados y la frecuencia: mientras más claro lo dejes, más firme es el precio.',
    },
  },
  {
    slug: 'control-de-plagas',
    nombre: 'Control de plagas',
    nombrePlural: 'Empresas de control de plagas',
    descripcion: 'Desratización, desinsectación y sanitización para empresas.',
    modo: ModoRubro.VENTA,
    orden: 3,
    precioExclusivoClp: 15_000,
    precioCompartidoClp: 6_000,
    campos: CAMPOS_PLAGAS,
    contenidoSeo: {
      intro:
        'Cuéntanos qué plaga tienes y dónde, y te contactan empresas certificadas que atienden tu comuna.',
      porQue:
        'En control de plagas la rapidez importa: mientras antes se trate, más barato sale.',
    },
  },
  {
    slug: 'banos-quimicos',
    nombre: 'Arriendo de baños químicos',
    nombrePlural: 'Empresas de arriendo de baños químicos',
    descripcion: 'Baños químicos para obras, faenas y eventos.',
    modo: ModoRubro.CAPTURA,
    orden: 4,
    precioExclusivoClp: null,
    precioCompartidoClp: null,
    campos: CAMPOS_CAPTURA,
    contenidoSeo: {
      intro:
        'Todavía estamos sumando empresas de arriendo de baños químicos en esta zona. Déjanos tu solicitud y te avisamos apenas tengamos proveedores.',
      porQue: 'Nos sirve saber cuánta demanda hay para abrir el rubro con buenas empresas.',
    },
  },
  {
    slug: 'generadores',
    nombre: 'Arriendo de generadores',
    nombrePlural: 'Empresas de arriendo de generadores',
    descripcion: 'Generadores eléctricos para obras, respaldo y eventos.',
    modo: ModoRubro.CAPTURA,
    orden: 5,
    precioExclusivoClp: null,
    precioCompartidoClp: null,
    campos: CAMPOS_CAPTURA,
    contenidoSeo: {
      intro:
        'Todavía estamos sumando empresas de arriendo de generadores en esta zona. Déjanos tu solicitud y te avisamos apenas tengamos proveedores.',
      porQue: 'Nos sirve saber cuánta demanda hay para abrir el rubro con buenas empresas.',
    },
  },
  {
    slug: 'transporte-de-personal',
    nombre: 'Transporte de personal',
    nombrePlural: 'Empresas de transporte de personal',
    descripcion: 'Acercamiento de trabajadores y traslados por turno.',
    modo: ModoRubro.CAPTURA,
    orden: 6,
    precioExclusivoClp: null,
    precioCompartidoClp: null,
    campos: CAMPOS_CAPTURA,
    contenidoSeo: {
      intro:
        'Todavía estamos sumando empresas de transporte de personal en esta zona. Déjanos tu solicitud y te avisamos apenas tengamos proveedores.',
      porQue: 'Nos sirve saber cuánta demanda hay para abrir el rubro con buenas empresas.',
    },
  },
  {
    slug: 'transporte-de-carga',
    nombre: 'Transporte de carga',
    nombrePlural: 'Empresas de transporte de carga',
    descripcion: 'Fletes, distribución y transporte de carga para empresas.',
    modo: ModoRubro.CAPTURA,
    orden: 7,
    precioExclusivoClp: null,
    precioCompartidoClp: null,
    campos: CAMPOS_CAPTURA,
    contenidoSeo: {
      intro:
        'Todavía estamos sumando empresas de transporte de carga en esta zona. Déjanos tu solicitud y te avisamos apenas tengamos proveedores.',
      porQue: 'Nos sirve saber cuánta demanda hay para abrir el rubro con buenas empresas.',
    },
  },
  {
    slug: 'climatizacion-industrial',
    nombre: 'Climatización industrial',
    nombrePlural: 'Empresas de climatización industrial',
    descripcion: 'Instalación y mantención de climatización para industria y oficinas.',
    modo: ModoRubro.CAPTURA,
    orden: 8,
    precioExclusivoClp: null,
    precioCompartidoClp: null,
    campos: CAMPOS_CAPTURA,
    contenidoSeo: {
      intro:
        'Todavía estamos sumando empresas de climatización industrial en esta zona. Déjanos tu solicitud y te avisamos apenas tengamos proveedores.',
      porQue: 'Nos sirve saber cuánta demanda hay para abrir el rubro con buenas empresas.',
    },
  },
]

/** Las 346 comunas oficiales (CUT). Sembrar no publica página SEO por cada una. */
export const COMUNAS = COMUNAS_CHILE

/**
 * Combinaciones {rubro}/{comuna} que sí se publican (piloto).
 * El formulario acepta cualquier comuna sembrada; el sitemap no explota.
 */
export const COMUNAS_SEO = [
  'santiago',
  'las-condes',
  'providencia',
  'vitacura',
  'nunoa',
  'maipu',
  'quilicura',
  'pudahuel',
] as const

export const REGION = 'Región Metropolitana'
