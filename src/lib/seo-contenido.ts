import { slugBdDesdePublico } from '@/lib/seo-rutas'

export type CopyRubro = {
  h1: string
  title: string
  description: string
  intro: string
  queIncluye: string[]
  cta: string
}

const COPY_RUBRO: Record<string, CopyRubro> = {
  seguridad: {
    h1: 'Guardias de seguridad para tu empresa',
    title: 'Guardias de seguridad',
    description:
      'Cotiza guardias de seguridad en tu comuna. Una solicitud y empresas de seguridad te contactan. Gratis para tu empresa.',
    intro:
      'Cuéntanos qué hay que cuidar y en qué comuna. Te contactan empresas de seguridad que cubren esa zona. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: [
      'Guardias de seguridad y conserjería',
      'Control de acceso',
      'Rondas de vigilancia',
    ],
    cta: 'Pedir cotización de guardias',
  },
  aseo: {
    h1: 'Empresas de aseo para tu empresa',
    title: 'Empresas de aseo',
    description:
      'Cotiza empresas de aseo para oficinas, plantas o edificios en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué hay que limpiar, los metros y la frecuencia. Te contactan empresas de aseo que atienden tu comuna. Sin cuenta para empezar. Cotizar no cuesta.',
    queIncluye: ['Aseo de oficinas', 'Aseo industrial y bodegas', 'Edificios y locales'],
    cta: 'Pedir cotización de aseo',
  },
  'control-de-plagas': {
    h1: 'Control de plagas para tu empresa',
    title: 'Control de plagas',
    description:
      'Cotiza control de plagas: desratización, desinsectación o sanitización en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué plaga viste y dónde. Te contactan empresas de control de plagas que cubren tu comuna. Sin cuenta para empezar. Mientras antes se trate, más barato sale.',
    queIncluye: ['Roedores', 'Insectos rastreros y termitas', 'Sanitización de recintos'],
    cta: 'Pedir cotización de plagas',
  },
  'banos-quimicos': {
    h1: 'Arriendo de baños químicos para tu empresa',
    title: 'Arriendo de baños químicos',
    description:
      'Cotiza arriendo de baños químicos para obras, faenas o eventos en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di para qué los necesitas y por cuántos días. Te contactan empresas de arriendo de baños químicos que cubren tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Obras y faenas', 'Eventos', 'Plantas e industria'],
    cta: 'Pedir cotización de baños químicos',
  },
  generadores: {
    h1: 'Arriendo de generadores para tu empresa',
    title: 'Arriendo de generadores',
    description:
      'Cotiza arriendo de generadores para obras, respaldo o eventos en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di para qué necesitas el generador y por cuántos días. Te contactan empresas de arriendo que atienden tu comuna. Sin cuenta para empezar. Cotizar no cuesta.',
    queIncluye: ['Obras y faenas', 'Respaldo eléctrico', 'Eventos'],
    cta: 'Pedir cotización de generadores',
  },
  'transporte-de-personal': {
    h1: 'Transporte de personal para tu empresa',
    title: 'Transporte de personal',
    description:
      'Cotiza transporte de personal y acercamiento de trabajadores en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di cuántas personas y en qué horario. Te contactan empresas de transporte de personal que cubren tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Acercamiento por turno', 'Recorridos fijos', 'Traslados puntuales'],
    cta: 'Pedir cotización de transporte de personal',
  },
  'transporte-de-carga': {
    h1: 'Transporte de carga para tu empresa',
    title: 'Transporte de carga',
    description:
      'Cotiza fletes y transporte de carga para tu empresa en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué hay que mover y de dónde a dónde. Te contactan empresas de transporte de carga que atienden tu comuna. Sin cuenta para empezar. Cotizar no cuesta.',
    queIncluye: ['Carga general', 'Distribución y fletes', 'Carga especial'],
    cta: 'Pedir cotización de transporte de carga',
  },
  'climatizacion-industrial': {
    h1: 'Climatización industrial para tu empresa',
    title: 'Climatización industrial',
    description:
      'Cotiza instalación o mantención de climatización industrial en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di si es instalación o mantención y en qué recinto. Te contactan empresas de climatización que cubren tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Instalación nueva', 'Mantención', 'Reparación'],
    cta: 'Pedir cotización de climatización',
  },
  gasfiteria: {
    h1: 'Gasfitería para tu casa o tu empresa',
    title: 'Gasfitería',
    description:
      'Cotiza un gasfiter en tu comuna: reparación, instalación o urgencia. Una solicitud. Gratis.',
    intro:
      'Di qué se echó a perder y te contactan gasfiteres que atienden tu comuna. Sirve para casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Reparaciones', 'Instalaciones', 'Urgencias de fuga o corte'],
    cta: 'Pedir cotización de gasfitería',
  },
  electricista: {
    h1: 'Electricista para tu casa o tu empresa',
    title: 'Electricista',
    description:
      'Cotiza un electricista en tu comuna: fallas, instalaciones o tableros. Una solicitud. Gratis.',
    intro:
      'Cuéntanos la falla o lo que hay que instalar. Te contactan electricistas de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Fallas y cortes', 'Instalación nueva', 'Tablero o ampliación'],
    cta: 'Pedir cotización de electricista',
  },
  destape: {
    h1: 'Destape y alcantarillado en tu comuna',
    title: 'Destape y alcantarillado',
    description:
      'Cotiza destape de WC, cañerías o alcantarillado en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué está tapado y te contactan empresas de destape de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['WC', 'Lavaplatos y ducha', 'Alcantarillado o cámara'],
    cta: 'Pedir cotización de destape',
  },
  pintura: {
    h1: 'Pintura para casa, depto o local',
    title: 'Pintura',
    description: 'Cotiza pintura interior o exterior en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué hay que pintar y te contactan pintores de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Interior', 'Exterior', 'Locales'],
    cta: 'Pedir cotización de pintura',
  },
  remodelaciones: {
    h1: 'Remodelaciones de casa, depto o local',
    title: 'Remodelaciones',
    description:
      'Cotiza remodelación de baño, cocina u obra menor en tu comuna. Una solicitud. Gratis.',
    intro:
      'Cuéntanos el alcance y te contactan maestros y empresas de remodelación de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Baño', 'Cocina', 'Ampliación o pieza'],
    cta: 'Pedir cotización de remodelación',
  },
  cerrajeria: {
    h1: 'Cerrajero en tu comuna',
    title: 'Cerrajero',
    description:
      'Cotiza un cerrajero: apertura, cambio de chapa o copias en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di si es apertura, cambio de chapa o copias. Te contactan cerrajeros de tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Apertura', 'Cambio de cerradura', 'Copia de llaves'],
    cta: 'Pedir cotización de cerrajero',
  },
  'tecnico-electrodomesticos': {
    h1: 'Técnico de electrodomésticos a domicilio',
    title: 'Técnico de electrodomésticos',
    description:
      'Cotiza reparación de lavadora, refrigerador u otro electrodoméstico en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué equipo falló y te contactan técnicos de tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Lavadora o secadora', 'Refrigerador', 'Lavavajillas'],
    cta: 'Pedir cotización de técnico',
  },
  mudanzas: {
    h1: 'Mudanzas y fletes en tu comuna',
    title: 'Mudanzas y fletes',
    description: 'Cotiza mudanza de casa, depto u oficina, o un flete, en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di origen, destino y si es casa u oficina. Te contactan empresas de mudanzas de tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Casa o depto', 'Oficina', 'Flete puntual'],
    cta: 'Pedir cotización de mudanza',
  },
  jardineria: {
    h1: 'Jardinería y áreas verdes',
    title: 'Jardinería',
    description:
      'Cotiza mantención de jardín, poda o instalación en tu comuna. Una solicitud. Gratis.',
    intro:
      'Cuéntanos el jardín y te contactan jardineros de tu comuna. Casa o empresa. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Mantención periódica', 'Poda', 'Diseño o instalación'],
    cta: 'Pedir cotización de jardinería',
  },
  'aseo-hogar': {
    h1: 'Aseo a domicilio para casas y departamentos',
    title: 'Aseo a domicilio',
    description:
      'Cotiza aseo de casa o depto en tu comuna. Distinto del aseo de oficinas. Una solicitud. Gratis.',
    intro:
      'Di si es una vez o periódico. Te contactan personas y empresas de aseo a domicilio en tu comuna. Esto no es aseo industrial: para oficinas usa Empresas de aseo. Tú no pagas.',
    queIncluye: ['Por horas', 'Periódico', 'Aseo de mudanza'],
    cta: 'Pedir cotización de aseo a domicilio',
  },
  'cuidado-adulto-mayor': {
    h1: 'Cuidado de adulto mayor a domicilio',
    title: 'Cuidado de adulto mayor',
    description:
      'Cotiza cuidadores a domicilio por horas o jornada en tu comuna. Una solicitud. Gratis.',
    intro:
      'Cuéntanos la jornada y te contactan servicios de cuidado a domicilio en tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Algunas horas', 'Jornada de día', 'Día y noche'],
    cta: 'Pedir cotización de cuidado',
  },
  contabilidad: {
    h1: 'Contabilidad para tu empresa',
    title: 'Contabilidad',
    description:
      'Cotiza un contador para F29, remuneraciones o contabilidad mensual en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué trámite o mes necesitas. Te contactan contadores que atienden tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Contabilidad mensual', 'Inicio de actividades', 'Remuneraciones'],
    cta: 'Pedir cotización de contabilidad',
  },
  'marketing-digital': {
    h1: 'Marketing digital para tu empresa',
    title: 'Marketing digital',
    description:
      'Cotiza pauta, redes o un sitio web con agencias o freelancers de tu zona. Una solicitud. Gratis.',
    intro:
      'Cuéntanos el canal y te contactan agencias o freelancers de tu zona. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Pauta (Google o Meta)', 'Redes sociales', 'Sitio web'],
    cta: 'Pedir cotización de marketing',
  },
  abogados: {
    h1: 'Abogados para personas y empresas',
    title: 'Abogados',
    description:
      'Cotiza un abogado laboral, civil, de familia o de empresa en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di el tipo de asunto (sin contar el caso entero). Te contactan abogados que atienden tu comuna. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Laboral', 'Civil o contratos', 'Familia', 'Empresa'],
    cta: 'Pedir cotización de abogado',
  },
  reclutamiento: {
    h1: 'Reclutamiento de personal para tu empresa',
    title: 'Reclutamiento',
    description:
      'Cotiza búsqueda de personal u headhunting en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di el cargo y la comuna. Te contactan empresas de reclutamiento. Sin cuenta para empezar. Tú no pagas.',
    queIncluye: ['Cargo operativo', 'Administrativo', 'Profesional o jefatura'],
    cta: 'Pedir cotización de reclutamiento',
  },
  'asesoria-financiera': {
    h1: 'Créditos y asesoría financiera con asesores',
    title: 'Créditos y asesoría financiera',
    description:
      'Cotiza asesores y corredores de crédito en tu comuna. Ternio no es un banco y no abre cuentas. Gratis.',
    intro:
      'Cuéntanos qué quieres evaluar. Te contactan asesores y corredores de tu zona. Ternio no es un banco, no abre cuentas y no otorga créditos. Tú no pagas por cotizar.',
    queIncluye: ['Crédito de consumo', 'Hipotecario', 'Refinanciar', 'Crédito para empresa'],
    cta: 'Pedir cotización de asesoría financiera',
  },
  seguros: {
    h1: 'Seguros con corredores (Ternio no vende pólizas)',
    title: 'Seguros',
    description:
      'Cotiza corredores de seguros de auto, hogar, vida o empresa. Ternio no es aseguradora. Gratis.',
    intro:
      'Di el tipo de seguro. Te contactan corredores que atienden tu comuna. Ternio no es una aseguradora y no vende pólizas. Tú no pagas por cotizar.',
    queIncluye: ['Auto', 'Hogar', 'Vida o salud', 'Empresa'],
    cta: 'Pedir cotización de seguros',
  },
}

const POR_QUE_COMBO: Record<string, (comuna: string, provincia: string) => string> = {
  seguridad: (c, p) =>
    `En ${c} el turno, los accesos y si hay OS-10 cambian el precio. Mientras más claro lo dejes, más útil es la cotización.`,
  aseo: (c, p) =>
    `En ${c} el metro cuadrado y la frecuencia mandan. Una oficina en ${p} no se cotiza igual que una planta.`,
  'control-de-plagas': (c, p) =>
    `En ${c} la rapidez importa: una plaga en un recinto de ${p} se trata antes de que se extienda.`,
  'banos-quimicos': (c, p) =>
    `En ${c} el plazo y la cantidad cambian el precio. Una obra en ${p} no se cotiza igual que un evento.`,
  generadores: (c, p) =>
    `En ${c} la potencia y los días de arriendo mandan. Un respaldo en ${p} no se cotiza igual que una faena.`,
  'transporte-de-personal': (c) =>
    `En ${c} el recorrido y los turnos cambian el valor. Un acercamiento diario no se cotiza igual que un traslado puntual.`,
  'transporte-de-carga': (c) =>
    `En ${c} el tipo de carga y la frecuencia mandan. Un flete único no se cotiza igual que una distribución semanal.`,
  'climatizacion-industrial': (c, p) =>
    `En ${c} el recinto y el tipo de equipo cambian el precio. Una oficina en ${p} no se cotiza igual que una planta.`,
  gasfiteria: (c) =>
    `En ${c} la urgencia y el tipo de arreglo cambian el precio. Una llave no se cotiza igual que una fuga.`,
  electricista: (c) =>
    `En ${c} un enchufe no se cotiza igual que un tablero. Mientras más detalle, más útil es la visita.`,
  destape: (c) =>
    `En ${c} un WC no se cotiza igual que una cámara. La urgencia manda el precio.`,
  pintura: (c, p) =>
    `En ${c} los metros y si es interior o fachada cambian el valor. Una pieza en ${p} no se cotiza igual que un local.`,
  remodelaciones: (c) =>
    `En ${c} un baño no se cotiza igual que una ampliación. El alcance manda el precio.`,
  cerrajeria: (c) =>
    `En ${c} una urgencia de madrugada no se cotiza igual que un cambio de chapa programado.`,
  'tecnico-electrodomesticos': (c) =>
    `En ${c} la marca y el tipo de falla cambian el valor. Un diagnóstico no se cotiza igual que un cambio de motor.`,
  mudanzas: (c) =>
    `En ${c} los pisos, el empaque y la distancia mandan. Un depto no se cotiza igual que una oficina.`,
  jardineria: (c) =>
    `En ${c} los metros y si es una visita o un contrato mensual cambian el precio.`,
  'aseo-hogar': (c) =>
    `En ${c} las horas y si es a fondo o mantención cambian el valor. Un depto no se cotiza igual que una casa.`,
  'cuidado-adulto-mayor': (c) =>
    `En ${c} las horas y el tipo de apoyo cambian el valor. Un turno diurno no se cotiza igual que un 24/7.`,
  contabilidad: (c) =>
    `En ${c} el régimen y si hay remuneraciones cambian el valor. Un F29 no se cotiza igual que una nómina.`,
  'marketing-digital': (c) =>
    `En ${c} pauta no se cotiza igual que un sitio. El objetivo manda el precio.`,
  abogados: (c) =>
    `En ${c} laboral no se cotiza igual que un contrato de empresa. El tipo de asunto manda.`,
  reclutamiento: (c) =>
    `En ${c} un cargo operativo no se cotiza igual que una jefatura. El perfil manda el valor.`,
  'asesoria-financiera': (c) =>
    `En ${c} un hipotecario no se cotiza igual que un consumo. El tipo de evaluación manda. Ternio no abre cuentas ni otorga créditos.`,
  seguros: (c) =>
    `En ${c} un SOAP no se cotiza igual que un seguro de empresa. El ramo manda. Ternio no vende pólizas.`,
}

function slugCopy(slugBd: string): string {
  return slugBdDesdePublico(slugBd)
}

export function copyRubro(slugBd: string, nombrePlural: string, descripcion: string | null): CopyRubro {
  return (
    COPY_RUBRO[slugCopy(slugBd)] ?? {
      h1: nombrePlural,
      title: nombrePlural,
      description: descripcion ?? `Cotiza ${nombrePlural.toLowerCase()} en tu comuna. Una solicitud. Gratis.`,
      intro:
        descripcion ??
        `Cuéntanos qué necesitas y en qué comuna. Te contactan empresas que cubren esa zona. Sin cuenta para empezar. Tú no pagas.`,
      queIncluye: [],
      cta: 'Pedir cotización',
    }
  )
}

export function titleCombo(args: { slugBd: string; nombrePlural: string; comuna: string }): string {
  const fijo = COPY_RUBRO[slugCopy(args.slugBd)]
  return fijo ? `${fijo.title} en ${args.comuna}` : `${args.nombrePlural} en ${args.comuna}`
}

export function copyCombo(args: {
  slugBd: string
  nombreRubro: string
  nombrePlural: string
  comuna: string
  region: string
  provincia: string
}): { h1: string; title: string; intro: string; porQue: string; description: string } {
  const slug = slugCopy(args.slugBd)
  const fijo = COPY_RUBRO[slug]
  const title = titleCombo({
    slugBd: args.slugBd,
    nombrePlural: args.nombrePlural,
    comuna: args.comuna,
  })
  const intro = fijo
    ? `${fijo.intro} En ${args.comuna} (${args.provincia}, ${args.region}) la solicitud queda atada a esa comuna: no se la ofrecemos a quien no la cubre.`
    : `Cotiza ${args.nombreRubro.toLowerCase()} en ${args.comuna}, ${args.region}. Te contactan empresas que cubren esa comuna. Tú no pagas.`
  const porQue =
    POR_QUE_COMBO[slug]?.(args.comuna, args.provincia) ??
    `En ${args.comuna} las empresas que cubren ${args.provincia} te contactan. Mientras más claro lo dejes, más útil es la cotización.`
  const description = `Cotiza ${title.toLowerCase()}. Una solicitud, empresas de ${args.region} te contactan. Gratis.`
  return { h1: title, title, intro, porQue, description }
}
