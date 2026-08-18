import { slugBdDesdePublico } from '@/lib/seo-rutas'

export type PreguntaFaq = {
  pregunta: string
  respuesta: string
}

export type CopyRubro = {
  h1: string
  title: string
  description: string
  intro: string
  queIncluye: string[]
  cta: string
  faq: PreguntaFaq[]
}

const COPY_RUBRO: Record<string, Omit<CopyRubro, 'faq'>> = {
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
  seguridad: (c) =>
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

const FAQ_RUBRO: Record<string, PreguntaFaq[]> = {
  seguridad: [
    {
      pregunta: '¿Tengo que pagar por cotizar guardias?',
      respuesta:
        'No. Tú no pagas. Las empresas de seguridad que cubren tu comuna te contactan. El proveedor paga el contacto si lo toma.',
    },
    {
      pregunta: '¿Puedo pedir un puesto 24/7 o solo un turno?',
      respuesta:
        'Las dos. En la solicitud di horario, si incluye festivos y cuántos accesos. Un 24/7 no se cotiza igual que un diurno de 8 horas.',
    },
    {
      pregunta: '¿Control de acceso es otro rubro?',
      respuesta:
        'No. Control de acceso va en la misma solicitud de seguridad. No abras otra cotización solo por eso.',
    },
    {
      pregunta: '¿Me van a llamar cinco empresas?',
      respuesta:
        'No. En compartido el tope es tres proveedores. Si uno toma exclusivo, se cierra el lead.',
    },
  ],
  aseo: [
    {
      pregunta: '¿Esto es aseo de oficinas o de casa?',
      respuesta:
        'De oficinas, plantas, bodegas y edificios. El aseo de casa o depto va en Aseo a domicilio.',
    },
    {
      pregunta: '¿Qué datos bajan el precio a tierra?',
      respuesta:
        'Metros, frecuencia y si los insumos los pones tú o la empresa. Sin metros, la cotización es un deseo.',
    },
    {
      pregunta: '¿Puedo pedir aseo de noche?',
      respuesta:
        'Sí. Dilas en la solicitud: el recargo nocturno existe y tiene que ir en el precio, no después.',
    },
    {
      pregunta: '¿Cotizar aseo cuesta?',
      respuesta: 'No. Una solicitud. Tú no pagas. Te contactan empresas que cubren tu comuna.',
    },
  ],
  'control-de-plagas': [
    {
      pregunta: '¿Sirve para casa y para empresa?',
      respuesta:
        'Sí. En empresa suele hacer falta informe y horario fuera de atención. En casa, el seguimiento de la misma plaga.',
    },
    {
      pregunta: '¿Tengo que saber el nombre de la plaga?',
      respuesta:
        'No. Di qué viste y dónde (cocina, cielo, cámara). El diagnóstico lo hace quien te contacte.',
    },
    {
      pregunta: '¿Una visita alcanza?',
      respuesta:
        'A veces. Roedores en un recinto con carga o cucarachas en un casino casi nunca se cierran en una tarde. Pregunta cuántas visitas van incluidas.',
    },
    {
      pregunta: '¿Paga el que cotiza?',
      respuesta: 'No. El formulario es gratis. El proveedor paga el contacto si lo toma.',
    },
  ],
  'banos-quimicos': [
    {
      pregunta: '¿Arriendan por día o por mes?',
      respuesta:
        'Las dos. Di para qué (obra, faena, evento) y cuántos días. Un evento de un fin de semana no se cotiza igual que una faena de tres meses.',
    },
    {
      pregunta: '¿Incluyen mantención y vaciado?',
      respuesta:
        'Pídelo por escrito. El arriendo “barato” a veces es solo el gabinete; el camión de retiro va aparte.',
    },
    {
      pregunta: '¿Llegan a faena o solo a ciudad?',
      respuesta:
        'Depende de la cobertura de cada empresa. La solicitud va atada a tu comuna: te contactan quienes la cubren.',
    },
    {
      pregunta: '¿Hay que pagar por pedir precio?',
      respuesta: 'No. La solicitud es gratis: tú no pagas por cotizar.',
    },
  ],
  generadores: [
    {
      pregunta: '¿Cotizan kVA o “un generador grande”?',
      respuesta:
        'Pide kVA o al menos para qué (obra, respaldo, evento) y si hay tablero. “Grande” no se cotiza.',
    },
    {
      pregunta: '¿El petróleo y el operador van en el precio?',
      respuesta:
        'No siempre. Pregunta si el arriendo es solo la máquina, si hay operador y quién carga el estanque.',
    },
    {
      pregunta: '¿Sirve para un corte de luz de oficina?',
      respuesta:
        'Sí, como respaldo. Di las horas y si hay que conectar a un tablero existente o es un enchufe de faena.',
    },
    {
      pregunta: '¿La cotización se cobra?',
      respuesta: 'No. Una solicitud. Tú no pagas por pedir precio.',
    },
  ],
  'transporte-de-personal': [
    {
      pregunta: '¿Es acercamiento diario o un traslado puntual?',
      respuesta:
        'Las dos. Un recorrido por turno no se cotiza igual que llevar a un equipo un sábado. Dilas en la solicitud.',
    },
    {
      pregunta: '¿Tengo que dar la nómina ahora?',
      respuesta:
        'No. Alcanza con cuántas personas, horario y comuna de origen o destino. La nómina va cuando hay trato.',
    },
    {
      pregunta: '¿Cubren turnos de noche?',
      respuesta:
        'Muchas sí. El horario es lo que más mueve el precio: dilo, no lo dejes para el WhatsApp del viernes.',
    },
    {
      pregunta: '¿Paga la empresa que cotiza?',
      respuesta: 'No. Tú no pagas por dejar la solicitud.',
    },
  ],
  'transporte-de-carga': [
    {
      pregunta: '¿Sirve para un flete único?',
      respuesta:
        'Sí. Di qué se mueve, peso o volumen si lo sabes, y de dónde a dónde. Un flete no es una mudanza de casa.',
    },
    {
      pregunta: '¿También distribución semanal?',
      respuesta:
        'Sí. Una ruta fija no se cotiza igual que un viaje. Marca la frecuencia en la solicitud.',
    },
    {
      pregunta: '¿Carga especial (frío, peligrosa)?',
      respuesta:
        'Dilo de entrada. Cambia el vehículo y a veces el permiso. Si no lo dices, te cotizan carga general.',
    },
    {
      pregunta: '¿Hay costo por cotizar?',
      respuesta: 'No. El comprador no paga la solicitud.',
    },
  ],
  'climatizacion-industrial': [
    {
      pregunta: '¿Es solo instalación o también mantención?',
      respuesta:
        'Las dos, y reparación. Di el recinto (oficina, planta, sala de servidores) y si ya hay equipos.',
    },
    {
      pregunta: '¿Sirve para un split de casa?',
      respuesta:
        'Esta landing es climatización industrial y de recintos de empresa. Un split doméstico a veces lo toma el mismo oficio; dilo igual y te dicen si no es su trabajo.',
    },
    {
      pregunta: '¿Tengo que nombrar la marca del equipo?',
      respuesta:
        'Ayuda. Si no la sabes, di toneladas o metros del recinto. “Que refresque” no se cotiza.',
    },
    {
      pregunta: '¿Paga quien pide la visita?',
      respuesta: 'No. Cotizar es gratis para quien pide el servicio.',
    },
  ],
  gasfiteria: [
    {
      pregunta: '¿Urgencia de noche se cotiza igual?',
      respuesta:
        'No. Fuga o inundación de madrugada lleva recargo. Una llave que gotea desde el lunes se programa y sale otra cosa.',
    },
    {
      pregunta: '¿Casa y empresa?',
      respuesta:
        'Sí. En empresa di el horario en que pueden entrar y si hay que facturar. En casa, el síntoma y la comuna alcanzan.',
    },
    {
      pregunta: '¿Y si es destape, no cañería?',
      respuesta:
        'Destape de WC o cámara es otro rubro. Si no estás seguro, describe el síntoma: quien te contacte te dice si no es gasfitería.',
    },
    {
      pregunta: '¿Hay que pagar por pedir el gasfiter?',
      respuesta: 'No. Tú no pagas por dejar la solicitud.',
    },
  ],
  electricista: [
    {
      pregunta: '¿Vienen por un corte o por un tablero nuevo?',
      respuesta:
        'Las dos. Un enchufe no se cotiza igual que una ampliación de tablero. Di si hay corte, olor a quemado o es obra nueva.',
    },
    {
      pregunta: '¿Sirve para casa y para local?',
      respuesta: 'Sí. En el local di si hay que trabajar fuera de atención.',
    },
    {
      pregunta: '¿Tengo que saber la potencia?',
      respuesta:
        'No. Di qué falló o qué quieres instalar. La carga se calcula en la visita si hace falta.',
    },
    {
      pregunta: '¿La cotización tiene costo?',
      respuesta: 'No. Quien pide la cotización no paga.',
    },
  ],
  destape: [
    {
      pregunta: '¿Es solo WC o también alcantarillado?',
      respuesta:
        'WC, lavaplatos, ducha, cámara y alcantarillado. Di qué está tapado y si ya rebasó.',
    },
    {
      pregunta: '¿Máquina o solo sonda?',
      respuesta:
        'Eso lo define quien visita. Una cámara no se cotiza igual que un WC. No pidas “la máquina” si no viste el problema.',
    },
    {
      pregunta: '¿Vienen de urgencia?',
      respuesta:
        'Muchas sí. Dilas si está rebasando: no es lo mismo que un lavaplatos lento desde hace una semana.',
    },
    {
      pregunta: '¿Paga el cliente por solicitar?',
      respuesta: 'No. Quien pide el servicio no paga la solicitud.',
    },
  ],
  pintura: [
    {
      pregunta: '¿Interior, fachada o local?',
      respuesta:
        'Las tres. Los metros y si hay que andamiar cambian el precio. Una pieza no se cotiza igual que una fachada.',
    },
    {
      pregunta: '¿Incluyen lija y masilla?',
      respuesta:
        'Pídelo. El “pintar” barato a veces es solo la mano de la última capa, sobre una muralla que no está lista.',
    },
    {
      pregunta: '¿Casa o empresa?',
      respuesta: 'Las dos. Un local con horario de atención pide trabajo en otro bloque; dilo.',
    },
    {
      pregunta: '¿Hay que pagar por cotizar pintura?',
      respuesta: 'No. Una solicitud. Cotizar es gratis.',
    },
  ],
  remodelaciones: [
    {
      pregunta: '¿Baño, cocina o ampliación?',
      respuesta:
        'Di el alcance. Un cambio de vanitorio no se cotiza igual que echar abajo un muro. Sin alcance, el precio es un saludo.',
    },
    {
      pregunta: '¿Hacen el proyecto o solo la obra?',
      respuesta:
        'Depende de la empresa. Si ya tienes planos, dilo. Si no, pregunta si la visita incluye una propuesta o solo mano de obra.',
    },
    {
      pregunta: '¿Sirve para un local, no solo casa?',
      respuesta: 'Sí. Un local suma permisos y horarios. Márcalo en la solicitud.',
    },
    {
      pregunta: '¿La solicitud se cobra?',
      respuesta: 'No. La solicitud es gratis: tú no pagas por cotizar.',
    },
  ],
  cerrajeria: [
    {
      pregunta: '¿Apertura de urgencia o cambio de chapa?',
      respuesta:
        'Las dos. Una apertura de madrugada no se cotiza igual que copiar llaves un martes. Di cuál es.',
    },
    {
      pregunta: '¿Vienen a empresas?',
      respuesta:
        'Sí. En un local o una oficina suele hacer falta un encargado que autorice el cambio de cilindro.',
    },
    {
      pregunta: '¿Tengo que estar en el recinto?',
      respuesta:
        'En una apertura, sí o alguien con derecho a entrar. Un cerrajero serio no abre “porque el socio lo pidió por WhatsApp” sin respaldo.',
    },
    {
      pregunta: '¿Paga quien pide el cerrajero?',
      respuesta: 'No. Pedir el cerrajero por acá no se cobra.',
    },
  ],
  'tecnico-electrodomesticos': [
    {
      pregunta: '¿Qué equipos cubre?',
      respuesta:
        'Lavadora, secadora, refrigerador, lavavajillas y similares de casa o de un local chico. Di marca y qué dejó de hacer.',
    },
    {
      pregunta: '¿El diagnóstico se descuenta?',
      respuesta:
        'Pregúntalo. Algunas visitas de diagnóstico se descuentan si reparas; otras no. Tiene que ir en el primer mensaje, no en la boleta.',
    },
    {
      pregunta: '¿Vienen si el aparato no tiene boleta?',
      respuesta:
        'Casi siempre sí. La boleta ayuda por la garantía de fábrica; no es requisito para pedir una visita por Ternio.',
    },
    {
      pregunta: '¿Hay que pagar por solicitar técnico?',
      respuesta: 'No. Tú no pagas por dejar la solicitud.',
    },
  ],
  mudanzas: [
    {
      pregunta: '¿Casa, depto u oficina?',
      respuesta:
        'Las tres, y flete puntual. Piso y ascensor cambian el precio más que “es Santiago”.',
    },
    {
      pregunta: '¿El empaque va incluido?',
      respuesta:
        'No siempre. Dilas si embalas tú o lo hacen ellos. Un “todo incluido” que no nombra cajas te las cobra en la rampa.',
    },
    {
      pregunta: '¿Un flete de unas cajas es mudanza?',
      respuesta:
        'No. Márcalo como flete. Si es oficina con cubículos, no es un flete: es mudanza.',
    },
    {
      pregunta: '¿Cotizar mudanza cuesta?',
      respuesta: 'No. Una solicitud. Tú no pagas por pedir precio.',
    },
  ],
  jardineria: [
    {
      pregunta: '¿Una poda o un contrato mensual?',
      respuesta:
        'Las dos. Los metros y si hay que sacar escombros cambian el valor. Una visita no se cotiza igual que un mensual.',
    },
    {
      pregunta: '¿Casa, condominio o empresa?',
      respuesta:
        'Las tres. Un área verde de empresa o un condominio pide horario y, a veces, seguro; dilo.',
    },
    {
      pregunta: '¿Incluyen plantas y pasto?',
      respuesta:
        'La mantención no siempre incluye reposición. Si quieres instalación o diseño, márcalo: no es el mismo trabajo que podar.',
    },
    {
      pregunta: '¿Paga el que pide jardinería?',
      respuesta: 'No. Cotizar es gratis para quien pide el servicio.',
    },
  ],
  'aseo-hogar': [
    {
      pregunta: '¿Es lo mismo que empresas de aseo?',
      respuesta:
        'No. Esto es casa o depto. Oficinas, plantas y edificios van en Empresas de aseo.',
    },
    {
      pregunta: '¿Por horas o por recinto?',
      respuesta:
        'Di metros o dormitorios y si es a fondo o mantención. “Unas horas” sin tamaño no se puede comparar.',
    },
    {
      pregunta: '¿Sirve para aseo de mudanza?',
      respuesta: 'Sí. Márcalo: no es el mismo tiempo que un semanal de depto.',
    },
    {
      pregunta: '¿Hay que pagar por pedir aseo a domicilio?',
      respuesta: 'No. Quien pide el servicio no paga la solicitud.',
    },
  ],
  'cuidado-adulto-mayor': [
    {
      pregunta: '¿Horas, jornada o día y noche?',
      respuesta:
        'Di la jornada. Unas horas no se cotizan igual que un 24/7. Si hay que levantar o hay un tratamiento, dilo sin contar la ficha clínica entera.',
    },
    {
      pregunta: '¿Es enfermería?',
      respuesta:
        'El rubro es cuidado a domicilio. Si necesitas procedimientos de enfermería, márcalo: no todo cuidador lo hace.',
    },
    {
      pregunta: '¿Puedo cotizar para un familiar en otra comuna?',
      respuesta:
        'Sí. La comuna es donde está la persona, no donde vives tú.',
    },
    {
      pregunta: '¿La solicitud tiene costo?',
      respuesta: 'No. Quien deja la solicitud no paga.',
    },
  ],
  contabilidad: [
    {
      pregunta: '¿Solo F29 o también remuneraciones?',
      respuesta:
        'Puedes pedir uno o los dos, o un mensual. Un F29 no se cotiza igual que una nómina. Di cuántos trabajadores hay.',
    },
    {
      pregunta: '¿Ternio presenta el formulario?',
      respuesta:
        'No. Ternio junta tu solicitud con contadores. El F29 y las declaraciones las hace el profesional que te contacte.',
    },
    {
      pregunta: '¿Sirve si la empresa no está en Santiago?',
      respuesta:
        'Sí. Muchos atienden a distancia. Igual elige la comuna de la empresa para filtrar cobertura.',
    },
    {
      pregunta: '¿Paga la pyme por cotizar?',
      respuesta: 'No. Tú no pagas por dejar la solicitud.',
    },
  ],
  'marketing-digital': [
    {
      pregunta: '¿Pauta, redes o sitio web?',
      respuesta:
        'Di el canal. Pauta de Google no se cotiza igual que un sitio ni que un community. “Quiero más ventas” no alcanza.',
    },
    {
      pregunta: '¿Tienen que ser agencias de mi comuna?',
      respuesta:
        'No siempre. La cobertura es de quien se anota. Si te da lo mismo online, dilo en el texto.',
    },
    {
      pregunta: '¿Incluye el presupuesto de anuncios?',
      respuesta:
        'Casi nunca. La cotización suele ser el trabajo (setup, gestión). La plata de pauta va a Google o Meta, no a Ternio.',
    },
    {
      pregunta: '¿Hay que pagar por pedir agencias?',
      respuesta: 'No. El comprador no paga la solicitud.',
    },
  ],
  abogados: [
    {
      pregunta: '¿Tengo que contar el caso entero en el formulario?',
      respuesta:
        'No. Di el tipo (laboral, civil, familia, empresa) y la comuna. El detalle va con el abogado, no en la ficha pública.',
    },
    {
      pregunta: '¿Es una defensa o un contrato?',
      respuesta:
        'Las dos. Un contrato de empresa no se cotiza igual que una demanda. Márcalo.',
    },
    {
      pregunta: '¿Ternio da consejo legal?',
      respuesta:
        'No. Solo junta tu solicitud con abogados que atienden tu comuna. Tú no pagas por cotizar.',
    },
    {
      pregunta: '¿Puedo cotizar si aún no hay demanda?',
      respuesta: 'Sí. Una consulta preventiva también se pide acá.',
    },
  ],
  reclutamiento: [
    {
      pregunta: '¿Un cargo operativo o una jefatura?',
      respuesta:
        'Di el perfil. Un operario no se cotiza igual que un gerencial. La comuna es donde va a trabajar la persona.',
    },
    {
      pregunta: '¿Es búsqueda o solo publicar el aviso?',
      respuesta:
        'El rubro es reclutamiento y headhunting. Si solo quieres un portal de avisos, dilo: no es el mismo servicio.',
    },
    {
      pregunta: '¿Cobran al candidato?',
      respuesta:
        'En Ternio el que cotiza es la empresa que busca gente, y no paga la solicitud. El arreglo de honorarios es con la reclutadora.',
    },
    {
      pregunta: '¿Puedo pedir varios cargos?',
      respuesta:
        'Sí, pero una solicitud por perfil se entiende mejor. Tres cargos distintos son tres alcances.',
    },
  ],
  'asesoria-financiera': [
    {
      pregunta: '¿Ternio es un banco o abre cuentas?',
      respuesta:
        'No. Ternio no es un banco, no abre cuentas y no otorga créditos. Te contactan asesores y corredores de tu zona.',
    },
    {
      pregunta: '¿Qué puedo cotizar?',
      respuesta:
        'Evaluación de consumo, hipotecario, refinanciar o crédito para empresa. El tipo manda el precio de la asesoría, no un “crédito Ternio”.',
    },
    {
      pregunta: '¿Me van a prestar plata acá?',
      respuesta:
        'No. Si hay un crédito, lo evalúa y lo otorga la institución con la que trabaje el asesor. Ternio solo junta el contacto.',
    },
    {
      pregunta: '¿Paga quien pide la asesoría?',
      respuesta: 'No. Cotizar es gratis para ti.',
    },
  ],
  seguros: [
    {
      pregunta: '¿Ternio vende pólizas?',
      respuesta:
        'No. Ternio no es aseguradora y no vende pólizas. Te contactan corredores que atienden tu comuna.',
    },
    {
      pregunta: '¿Auto, hogar, vida o empresa?',
      respuesta:
        'Di el ramo. Un SOAP no se cotiza igual que un seguro de empresa. El corredor arma la oferta, no Ternio.',
    },
    {
      pregunta: '¿Queda contratado al enviar el formulario?',
      respuesta:
        'No. Solo dejas la solicitud. Cualquier póliza se cierra con el corredor y la compañía, no con Ternio.',
    },
    {
      pregunta: '¿Hay que pagar por pedir corredores?',
      respuesta: 'No. La solicitud es gratis: tú no pagas por cotizar.',
    },
  ],
}

function slugCopy(slugBd: string): string {
  return slugBdDesdePublico(slugBd)
}

export function faqRubro(slugBd: string): PreguntaFaq[] {
  return FAQ_RUBRO[slugCopy(slugBd)] ?? []
}

export function jsonLdFaq(items: readonly PreguntaFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
    })),
  }
}

export function copyRubro(slugBd: string, nombrePlural: string, descripcion: string | null): CopyRubro {
  const slug = slugCopy(slugBd)
  const fijo = COPY_RUBRO[slug]
  const faq = FAQ_RUBRO[slug] ?? []
  if (fijo) return { ...fijo, faq }
  return {
    h1: nombrePlural,
    title: nombrePlural,
    description: descripcion ?? `Cotiza ${nombrePlural.toLowerCase()} en tu comuna. Una solicitud. Gratis.`,
    intro:
      descripcion ??
      `Cuéntanos qué necesitas y en qué comuna. Te contactan empresas que cubren esa zona. Sin cuenta para empezar. Tú no pagas.`,
    queIncluye: [],
    cta: 'Pedir cotización',
    faq,
  }
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
}): { h1: string; title: string; intro: string; porQue: string; description: string; faq: PreguntaFaq[] } {
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
  return { h1: title, title, intro, porQue, description, faq: FAQ_RUBRO[slug] ?? [] }
}
