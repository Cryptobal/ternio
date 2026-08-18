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
}

function slugCopy(slugBd: string): string {
  if (slugBd === 'plagas') return 'control-de-plagas'
  if (slugBd === 'climatizacion') return 'climatizacion-industrial'
  return slugBd
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
  const slug = slugCopy(args.slugBd)
  if (slug === 'seguridad') return `Guardias de seguridad en ${args.comuna}`
  if (slug === 'aseo') return `Empresas de aseo en ${args.comuna}`
  if (slug === 'control-de-plagas') return `Control de plagas en ${args.comuna}`
  if (slug === 'banos-quimicos') return `Arriendo de baños químicos en ${args.comuna}`
  if (slug === 'generadores') return `Arriendo de generadores en ${args.comuna}`
  if (slug === 'transporte-de-personal') return `Transporte de personal en ${args.comuna}`
  if (slug === 'transporte-de-carga') return `Transporte de carga en ${args.comuna}`
  if (slug === 'climatizacion-industrial') return `Climatización industrial en ${args.comuna}`
  return `${args.nombrePlural} en ${args.comuna}`
}

export function copyCombo(args: {
  slugBd: string
  nombreRubro: string
  nombrePlural: string
  comuna: string
  region: string
  provincia: string
}): { h1: string; title: string; intro: string; porQue: string; description: string } {
  const fijo = COPY_RUBRO[slugCopy(args.slugBd)]
  const title = titleCombo({
    slugBd: args.slugBd,
    nombrePlural: args.nombrePlural,
    comuna: args.comuna,
  })
  const intro = fijo
    ? `${fijo.intro} En ${args.comuna} (${args.provincia}, ${args.region}) la solicitud queda atada a esa comuna: no se la ofrecemos a quien no la cubre.`
    : `Cotiza ${args.nombreRubro.toLowerCase()} en ${args.comuna}, ${args.region}. Te contactan empresas que cubren esa comuna. Tú no pagas.`
  const slug = slugCopy(args.slugBd)
  const porQue =
    slug === 'seguridad'
      ? `En ${args.comuna} el turno, los accesos y si hay OS-10 cambian el precio. Mientras más claro lo dejes, más útil es la cotización.`
      : slug === 'aseo'
        ? `En ${args.comuna} el metro cuadrado y la frecuencia mandan. Una oficina en ${args.provincia} no se cotiza igual que una planta.`
        : slug === 'control-de-plagas'
          ? `En ${args.comuna} la rapidez importa: una plaga en un recinto de ${args.provincia} se trata antes de que se extienda.`
          : slug === 'banos-quimicos'
            ? `En ${args.comuna} el plazo y la cantidad cambian el precio. Una obra en ${args.provincia} no se cotiza igual que un evento.`
            : slug === 'generadores'
              ? `En ${args.comuna} la potencia y los días de arriendo mandan. Un respaldo en ${args.provincia} no se cotiza igual que una faena.`
              : slug === 'transporte-de-personal'
                ? `En ${args.comuna} el recorrido y los turnos cambian el valor. Un acercamiento diario no se cotiza igual que un traslado puntual.`
                : slug === 'transporte-de-carga'
                  ? `En ${args.comuna} el tipo de carga y la frecuencia mandan. Un flete único no se cotiza igual que una distribución semanal.`
                  : slug === 'climatizacion-industrial'
                    ? `En ${args.comuna} el recinto y el tipo de equipo cambian el precio. Una oficina en ${args.provincia} no se cotiza igual que una planta.`
                    : `En ${args.comuna} las empresas que cubren ${args.provincia} te contactan. Mientras más claro lo dejes, más útil es la cotización.`
  const description = `Cotiza ${title.toLowerCase()}. Una solicitud, empresas de ${args.region} te contactan. Gratis.`
  return { h1: title, title, intro, porQue, description }
}
