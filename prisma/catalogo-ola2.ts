import { ModoRubro } from '@prisma/client'

import type { CampoFormulario } from '../src/lib/campos'

type SemillaOla2 = {
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

const PLAZO: CampoFormulario = {
  nombre: 'plazo',
  etiqueta: '¿Para cuándo lo necesitas?',
  tipo: 'select',
  requerido: true,
  opciones: [
    { valor: 'urgente', etiqueta: 'Lo antes posible' },
    { valor: 'esta_semana', etiqueta: 'Esta semana' },
    { valor: 'este_mes', etiqueta: 'Este mes' },
    { valor: 'cotizando', etiqueta: 'Solo estoy cotizando' },
  ],
}

function camposCortos(
  tipo: CampoFormulario,
  placeholderDetalle: string,
): CampoFormulario[] {
  return [
    tipo,
    PLAZO,
    {
      nombre: 'detalle',
      etiqueta: 'Cuéntanos un poco más',
      tipo: 'textarea',
      requerido: false,
      placeholder: placeholderDetalle,
    },
  ]
}

function rubroVenta(args: {
  slug: string
  nombre: string
  nombrePlural: string
  descripcion: string
  orden: number
  precioExclusivoClp: number
  precioCompartidoClp: number
  campos: CampoFormulario[]
  intro: string
  porQue: string
}): SemillaOla2 {
  return {
    slug: args.slug,
    nombre: args.nombre,
    nombrePlural: args.nombrePlural,
    descripcion: args.descripcion,
    modo: ModoRubro.VENTA,
    orden: args.orden,
    precioExclusivoClp: args.precioExclusivoClp,
    precioCompartidoClp: args.precioCompartidoClp,
    campos: args.campos,
    contenidoSeo: { intro: args.intro, porQue: args.porQue },
  }
}

export const RUBROS_OLA2: SemillaOla2[] = [
  rubroVenta({
    slug: 'gasfiteria',
    nombre: 'Gasfitería',
    nombrePlural: 'Gasfitería',
    descripcion: 'Reparaciones, instalaciones y urgencias de gasfitería en casa o empresa.',
    orden: 20,
    precioExclusivoClp: 12_000,
    precioCompartidoClp: 5_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'reparacion', etiqueta: 'Una reparación' },
          { valor: 'instalacion', etiqueta: 'Una instalación' },
          { valor: 'urgencia', etiqueta: 'Una urgencia (fuga o corte)' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Cañería, llave, calefont, WC? ¿Casa o local?',
    ),
    intro:
      'Di qué se echó a perder y te contactan gasfiteres que atienden tu comuna. Sirve para casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'En gasfitería la urgencia y el tipo de arreglo cambian el precio. Mientras más claro lo dejes, más firme es la cotización.',
  }),
  rubroVenta({
    slug: 'electricista',
    nombre: 'Electricista',
    nombrePlural: 'Electricista',
    descripcion: 'Instalaciones, fallas y tableros eléctricos para casa o empresa.',
    orden: 21,
    precioExclusivoClp: 12_000,
    precioCompartidoClp: 5_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'falla', etiqueta: 'Una falla o un corte' },
          { valor: 'instalacion', etiqueta: 'Una instalación nueva' },
          { valor: 'tablero', etiqueta: 'Tablero o ampliación' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Casa, depto o local? ¿Qué está fallando?',
    ),
    intro:
      'Cuéntanos la falla o lo que hay que instalar. Te contactan electricistas de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Un enchufe no se cotiza igual que un tablero. Mientras más detalle, más útil es la visita.',
  }),
  rubroVenta({
    slug: 'destape',
    nombre: 'Destape y alcantarillado',
    nombrePlural: 'Destape y alcantarillado',
    descripcion: 'Destape de cañerías, WC y alcantarillado en casa o empresa.',
    orden: 22,
    precioExclusivoClp: 10_000,
    precioCompartidoClp: 4_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué está tapado?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'wc', etiqueta: 'WC' },
          { valor: 'lavaplatos', etiqueta: 'Lavaplatos o ducha' },
          { valor: 'alcantarillado', etiqueta: 'Alcantarillado o cámara' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Desde cuándo? ¿Hay agua en el piso?',
    ),
    intro:
      'Di qué está tapado y te contactan empresas de destape de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Un WC no se cotiza igual que una cámara. La urgencia manda el precio.',
  }),
  rubroVenta({
    slug: 'pintura',
    nombre: 'Pintura',
    nombrePlural: 'Pintura',
    descripcion: 'Pintura interior y exterior para casa, depto o local.',
    orden: 23,
    precioExclusivoClp: 15_000,
    precioCompartidoClp: 6_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué hay que pintar?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'interior', etiqueta: 'Interior' },
          { valor: 'exterior', etiqueta: 'Exterior' },
          { valor: 'ambos', etiqueta: 'Interior y exterior' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Cuántos metros o piezas? ¿Casa, depto o local?',
    ),
    intro:
      'Di qué hay que pintar y te contactan pintores de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Los metros y si es interior o fachada cambian el valor. Una pieza no se cotiza igual que un local.',
  }),
  rubroVenta({
    slug: 'remodelaciones',
    nombre: 'Remodelaciones',
    nombrePlural: 'Remodelaciones',
    descripcion: 'Obras menores y remodelaciones de casa, depto o local.',
    orden: 24,
    precioExclusivoClp: 25_000,
    precioCompartidoClp: 10_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué quieres remodelar?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'bano', etiqueta: 'Baño' },
          { valor: 'cocina', etiqueta: 'Cocina' },
          { valor: 'ampliacion', etiqueta: 'Ampliación o pieza' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Casa, depto o local? ¿Ya tienes idea del alcance?',
    ),
    intro:
      'Cuéntanos el alcance y te contactan maestros y empresas de remodelación de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Un baño no se cotiza igual que una ampliación. El alcance manda el precio.',
  }),
  rubroVenta({
    slug: 'cerrajeria',
    nombre: 'Cerrajero',
    nombrePlural: 'Cerrajero',
    descripcion: 'Apertura, cambio de cerraduras y copias de llave.',
    orden: 25,
    precioExclusivoClp: 8_000,
    precioCompartidoClp: 3_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'apertura', etiqueta: 'Abrir una puerta o un auto' },
          { valor: 'cambio', etiqueta: 'Cambiar cerradura' },
          { valor: 'copia', etiqueta: 'Copia de llaves' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Casa, depto, local o auto?',
    ),
    intro:
      'Di si es apertura, cambio de chapa o copias. Te contactan cerrajeros de tu comuna. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Una urgencia de madrugada no se cotiza igual que un cambio de chapa programado.',
  }),
  rubroVenta({
    slug: 'tecnico-electrodomesticos',
    nombre: 'Técnico de electrodomésticos',
    nombrePlural: 'Técnico de electrodomésticos',
    descripcion: 'Reparación de lavadoras, refrigeradores y otros electrodomésticos.',
    orden: 26,
    precioExclusivoClp: 8_000,
    precioCompartidoClp: 3_000,
    campos: camposCortos(
      {
        nombre: 'tipo_equipo',
        etiqueta: '¿Qué equipo es?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'lavadora', etiqueta: 'Lavadora o secadora' },
          { valor: 'refri', etiqueta: 'Refrigerador' },
          { valor: 'lavavajillas', etiqueta: 'Lavavajillas' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Qué marca y qué le pasa?',
    ),
    intro:
      'Di qué equipo falló y te contactan técnicos de tu comuna. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'La marca y el tipo de falla cambian el valor. Un diagnóstico no se cotiza igual que un cambio de motor.',
  }),
  rubroVenta({
    slug: 'mudanzas',
    nombre: 'Mudanzas y fletes',
    nombrePlural: 'Mudanzas y fletes',
    descripcion: 'Mudanzas de casa o oficina y fletes dentro de Chile.',
    orden: 27,
    precioExclusivoClp: 15_000,
    precioCompartidoClp: 6_000,
    campos: camposCortos(
      {
        nombre: 'tipo_servicio',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'casa', etiqueta: 'Mudanza de casa o depto' },
          { valor: 'oficina', etiqueta: 'Mudanza de oficina' },
          { valor: 'flete', etiqueta: 'Un flete puntual' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿De dónde a dónde? ¿Pisos, ascensor, empaque?',
    ),
    intro:
      'Di origen, destino y si es casa u oficina. Te contactan empresas de mudanzas de tu comuna. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Los pisos, el empaque y la distancia mandan. Un depto no se cotiza igual que una oficina.',
  }),
  rubroVenta({
    slug: 'jardineria',
    nombre: 'Jardinería',
    nombrePlural: 'Jardinería',
    descripcion: 'Mantención de jardines, podas y áreas verdes.',
    orden: 28,
    precioExclusivoClp: 10_000,
    precioCompartidoClp: 4_000,
    campos: camposCortos(
      {
        nombre: 'tipo_trabajo',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'mantencion', etiqueta: 'Mantención periódica' },
          { valor: 'poda', etiqueta: 'Poda' },
          { valor: 'diseno', etiqueta: 'Diseño o instalación' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Casa, condominio o empresa? ¿Metros aproximados?',
    ),
    intro:
      'Cuéntanos el jardín y te contactan jardineros de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Los metros y si es una visita o un contrato mensual cambian el precio.',
  }),
  rubroVenta({
    slug: 'aseo-hogar',
    nombre: 'Aseo a domicilio',
    nombrePlural: 'Aseo a domicilio',
    descripcion: 'Aseo de casas y departamentos. Distinto del aseo de empresas y oficinas.',
    orden: 29,
    precioExclusivoClp: 8_000,
    precioCompartidoClp: 3_000,
    campos: camposCortos(
      {
        nombre: 'tipo_servicio',
        etiqueta: '¿Qué aseo necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'por_hora', etiqueta: 'Por horas, una vez' },
          { valor: 'periodico', etiqueta: 'Periódico (semanal o quincenal)' },
          { valor: 'mudanza', etiqueta: 'Aseo de mudanza o a fondo' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Casa o depto? ¿Metros o piezas?',
    ),
    intro:
      'Di si es una vez o periódico. Te contactan personas y empresas de aseo a domicilio en tu comuna. Esto no es aseo industrial: para oficinas usa Empresas de aseo. Tú no pagas.',
    porQue: 'Las horas y si es a fondo o mantención cambian el valor. Un depto no se cotiza igual que una casa.',
  }),
  rubroVenta({
    slug: 'cuidado-adulto-mayor',
    nombre: 'Cuidado de adulto mayor',
    nombrePlural: 'Cuidado de adulto mayor',
    descripcion: 'Cuidadores a domicilio por horas o jornada.',
    orden: 30,
    precioExclusivoClp: 20_000,
    precioCompartidoClp: 8_000,
    campos: camposCortos(
      {
        nombre: 'tipo_jornada',
        etiqueta: '¿Qué jornada necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'horas', etiqueta: 'Algunas horas al día' },
          { valor: 'diurna', etiqueta: 'Jornada de día' },
          { valor: '24_7', etiqueta: 'Día y noche' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Cuántos días a la semana? ¿Hay que ayudar con medicamentos o movilidad?',
    ),
    intro:
      'Cuéntanos la jornada y te contactan servicios de cuidado a domicilio en tu comuna. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Las horas y el tipo de apoyo cambian el valor. Un turno diurno no se cotiza igual que un 24/7.',
  }),
  rubroVenta({
    slug: 'contabilidad',
    nombre: 'Contabilidad',
    nombrePlural: 'Contabilidad',
    descripcion: 'Contadores para pymes: F29, remuneraciones y contabilidad mensual.',
    orden: 40,
    precioExclusivoClp: 20_000,
    precioCompartidoClp: 8_000,
    campos: camposCortos(
      {
        nombre: 'tipo_servicio',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'mensual', etiqueta: 'Contabilidad mensual' },
          { valor: 'inicio', etiqueta: 'Inicio de actividades' },
          { valor: 'remuneraciones', etiqueta: 'Remuneraciones' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Pyme, sociedad o persona? ¿Ya facturas?',
    ),
    intro:
      'Di qué trámite o mes necesitas. Te contactan contadores que atienden tu comuna. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'El régimen y si hay remuneraciones cambian el valor. Un F29 no se cotiza igual que una nómina.',
  }),
  rubroVenta({
    slug: 'marketing-digital',
    nombre: 'Marketing digital',
    nombrePlural: 'Marketing digital',
    descripcion: 'Agencias y freelancers de pauta, redes y sitios web.',
    orden: 41,
    precioExclusivoClp: 25_000,
    precioCompartidoClp: 10_000,
    campos: camposCortos(
      {
        nombre: 'tipo_servicio',
        etiqueta: '¿Qué necesitas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'pauta', etiqueta: 'Pauta (Google o Meta)' },
          { valor: 'redes', etiqueta: 'Redes sociales' },
          { valor: 'web', etiqueta: 'Sitio web' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Qué vendes y qué resultado buscas?',
    ),
    intro:
      'Cuéntanos el canal y te contactan agencias o freelancers de tu zona. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Pauta no se cotiza igual que un sitio. El objetivo manda el precio.',
  }),
  rubroVenta({
    slug: 'abogados',
    nombre: 'Abogados',
    nombrePlural: 'Abogados',
    descripcion: 'Asesoría legal laboral, civil, familia o empresa.',
    orden: 42,
    precioExclusivoClp: 25_000,
    precioCompartidoClp: 10_000,
    campos: camposCortos(
      {
        nombre: 'tipo_asunto',
        etiqueta: '¿De qué se trata?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'laboral', etiqueta: 'Laboral' },
          { valor: 'civil', etiqueta: 'Civil o contratos' },
          { valor: 'familia', etiqueta: 'Familia' },
          { valor: 'empresa', etiqueta: 'Empresa o societario' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      'En una frase, sin datos sensibles de terceros.',
    ),
    intro:
      'Di el tipo de asunto (sin contar el caso entero). Te contactan abogados que atienden tu comuna. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Laboral no se cotiza igual que un contrato de empresa. El tipo de asunto manda.',
  }),
  rubroVenta({
    slug: 'reclutamiento',
    nombre: 'Reclutamiento',
    nombrePlural: 'Reclutamiento',
    descripcion: 'Búsqueda de personal y headhunting para empresas.',
    orden: 43,
    precioExclusivoClp: 20_000,
    precioCompartidoClp: 8_000,
    campos: camposCortos(
      {
        nombre: 'tipo_busqueda',
        etiqueta: '¿Qué cargo buscas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'operativo', etiqueta: 'Cargo operativo o terreno' },
          { valor: 'admin', etiqueta: 'Administrativo' },
          { valor: 'profesional', etiqueta: 'Profesional o jefatura' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      '¿Ciudad, jornada y si es un cargo o varios?',
    ),
    intro:
      'Di el cargo y la comuna. Te contactan empresas de reclutamiento. Sin cuenta para empezar. Tú no pagas.',
    porQue: 'Un cargo operativo no se cotiza igual que una jefatura. El perfil manda el valor.',
  }),
  rubroVenta({
    slug: 'asesoria-financiera',
    nombre: 'Créditos y asesoría financiera',
    nombrePlural: 'Créditos y asesoría financiera',
    descripcion:
      'Asesores y corredores de crédito. Ternio no es un banco y no abre cuentas.',
    orden: 50,
    precioExclusivoClp: 25_000,
    precioCompartidoClp: 10_000,
    campos: camposCortos(
      {
        nombre: 'tipo_asesoria',
        etiqueta: '¿Qué quieres evaluar?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'consumo', etiqueta: 'Crédito de consumo' },
          { valor: 'hipotecario', etiqueta: 'Crédito hipotecario' },
          { valor: 'refinanciar', etiqueta: 'Refinanciar deudas' },
          { valor: 'pyme', etiqueta: 'Crédito para mi empresa' },
          { valor: 'otro', etiqueta: 'Otra asesoría' },
        ],
      },
      'Sin inventar montos si no los tienes. Ternio solo te pasa con asesores.',
    ),
    intro:
      'Cuéntanos qué quieres evaluar. Te contactan asesores y corredores de tu zona. Ternio no es un banco, no abre cuentas y no otorga créditos. Tú no pagas por cotizar.',
    porQue: 'Un hipotecario no se cotiza igual que un consumo. El tipo de evaluación manda. Nadie aquí te abre una cuenta.',
  }),
  rubroVenta({
    slug: 'seguros',
    nombre: 'Seguros',
    nombrePlural: 'Seguros',
    descripcion: 'Corredores de seguros de auto, hogar, vida o empresa. Ternio no vende pólizas.',
    orden: 51,
    precioExclusivoClp: 15_000,
    precioCompartidoClp: 6_000,
    campos: camposCortos(
      {
        nombre: 'tipo_seguro',
        etiqueta: '¿Qué seguro buscas?',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'auto', etiqueta: 'Auto' },
          { valor: 'hogar', etiqueta: 'Hogar' },
          { valor: 'vida_salud', etiqueta: 'Vida o salud' },
          { valor: 'empresa', etiqueta: 'Empresa' },
          { valor: 'otro', etiqueta: 'Otro' },
        ],
      },
      'Te contactan corredores. Ternio no emite pólizas.',
    ),
    intro:
      'Di el tipo de seguro. Te contactan corredores que atienden tu comuna. Ternio no es una aseguradora y no vende pólizas. Tú no pagas por cotizar.',
    porQue: 'Un SOAP no se cotiza igual que un seguro de empresa. El ramo manda. Nadie aquí te abre una cuenta bancaria.',
  }),
]
