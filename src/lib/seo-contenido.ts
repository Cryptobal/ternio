import { pathPublicoCombo, pathPublicoRubro } from '@/lib/seo-rutas'

export type CopyRubro = {
  h1: string
  title: string
  description: string
  intro: string
  queIncluye: string[]
  cta: string
  atajoCombo?: { href: string; etiqueta: string }
}

const COPY_RUBRO: Record<string, CopyRubro> = {
  seguridad: {
    h1: 'Guardias de seguridad para tu empresa',
    title: 'Guardias de seguridad',
    description:
      'Cotiza guardias de seguridad en tu comuna. Una solicitud y empresas de seguridad te contactan. Gratis para tu empresa.',
    intro:
      'Cuéntanos qué hay que cuidar y en qué comuna. Te contactan empresas de seguridad que cubren esa zona. Sin registro para empezar. Tú no pagas.',
    queIncluye: [
      'Guardias de seguridad y conserjería',
      'Control de acceso',
      'Rondas de vigilancia',
    ],
    cta: 'Pedir cotización de guardias',
    atajoCombo: {
      href: pathPublicoCombo('seguridad', 'santiago'),
      etiqueta: 'Guardias de seguridad en Santiago',
    },
  },
  aseo: {
    h1: 'Empresas de aseo para tu empresa',
    title: 'Empresas de aseo',
    description:
      'Cotiza empresas de aseo para oficinas, plantas o edificios en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué hay que limpiar, los metros y la frecuencia. Te contactan empresas de aseo que atienden tu comuna. Cotizar no cuesta.',
    queIncluye: ['Aseo de oficinas', 'Aseo industrial y bodegas', 'Edificios y locales'],
    cta: 'Pedir cotización de aseo',
    atajoCombo: {
      href: pathPublicoCombo('aseo', 'santiago'),
      etiqueta: 'Empresas de aseo en Santiago',
    },
  },
  'control-de-plagas': {
    h1: 'Control de plagas para tu empresa',
    title: 'Control de plagas',
    description:
      'Cotiza control de plagas: desratización, desinsectación o sanitización en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué plaga viste y dónde. Te contactan empresas de control de plagas que cubren tu comuna. Mientras antes se trate, más barato sale.',
    queIncluye: ['Roedores', 'Insectos rastreros y termitas', 'Sanitización de recintos'],
    cta: 'Pedir cotización de plagas',
  },
}

export function copyRubro(slugBd: string, nombrePlural: string, descripcion: string | null): CopyRubro {
  return (
    COPY_RUBRO[slugBd] ?? {
      h1: nombrePlural,
      title: nombrePlural,
      description: descripcion ?? `Cotiza ${nombrePlural.toLowerCase()} en tu comuna.`,
      intro: descripcion ?? `Cuéntanos qué necesitas y te avisamos cuando haya empresas en tu zona.`,
      queIncluye: [],
      cta: 'Pedir cotización',
    }
  )
}

export function titleCombo(args: { slugBd: string; nombrePlural: string; comuna: string }): string {
  if (args.slugBd === 'seguridad') return `Guardias de seguridad en ${args.comuna}`
  if (args.slugBd === 'aseo') return `Empresas de aseo en ${args.comuna}`
  if (args.slugBd === 'control-de-plagas') return `Control de plagas en ${args.comuna}`
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
  const fijo = COPY_RUBRO[args.slugBd]
  const title = titleCombo({
    slugBd: args.slugBd,
    nombrePlural: args.nombrePlural,
    comuna: args.comuna,
  })
  const intro = fijo
    ? `${fijo.intro} En ${args.comuna} (${args.provincia}, ${args.region}) la solicitud queda atada a esa comuna: no se la ofrecemos a quien no la cubre.`
    : `Cotiza ${args.nombreRubro.toLowerCase()} en ${args.comuna}, ${args.region}. Deja la solicitud y te avisamos.`
  const porQue =
    args.slugBd === 'seguridad'
      ? `En ${args.comuna} el turno, los accesos y si hay OS-10 cambian el precio. Mientras más claro lo dejes, más útil es la cotización.`
      : args.slugBd === 'aseo'
        ? `En ${args.comuna} el metro cuadrado y la frecuencia mandan. Una oficina en ${args.provincia} no se cotiza igual que una planta.`
        : args.slugBd === 'control-de-plagas'
          ? `En ${args.comuna} la rapidez importa: una plaga en un recinto de ${args.provincia} se trata antes de que se extienda.`
          : `Estamos sumando empresas de este rubro en ${args.comuna}. Tu solicitud queda en lista de espera.`
  const description = `Cotiza ${title.toLowerCase()}. Una solicitud, empresas de ${args.region} te contactan. Gratis.`
  return { h1: title, title, intro, porQue, description }
}

export function atajosHome(): Array<{ href: string; etiqueta: string }> {
  return [
    { href: pathPublicoRubro('seguridad'), etiqueta: 'Guardias de seguridad' },
    { href: pathPublicoRubro('aseo'), etiqueta: 'Empresas de aseo' },
    { href: pathPublicoRubro('control-de-plagas'), etiqueta: 'Control de plagas' },
  ]
}
