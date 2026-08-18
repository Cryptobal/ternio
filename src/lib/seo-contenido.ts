import { pathPublicoRubro } from '@/lib/seo-rutas'

export type CopyRubro = {
  h1: string
  title: string
  description: string
  intro: string
  queIncluye: string[]
}

const COPY_RUBRO: Record<string, CopyRubro> = {
  seguridad: {
    h1: 'Guardias de seguridad para tu empresa',
    title: 'Guardias de seguridad para empresas',
    description:
      'Cotiza guardias, control de acceso o rondas en tu comuna. Una solicitud, empresas de seguridad te contactan. Gratis.',
    intro:
      'Cuéntanos qué hay que cuidar y en qué comuna. Te contactan empresas de seguridad que cubren esa zona. Sin registro para empezar. El comprador no paga.',
    queIncluye: [
      'Guardias de seguridad y conserjería',
      'Control de acceso',
      'Rondas de vigilancia',
    ],
  },
  aseo: {
    h1: 'Aseo de oficinas e industrial',
    title: 'Empresas de aseo para tu empresa',
    description:
      'Cotiza aseo de oficinas, plantas o edificios en tu comuna. Una solicitud. Gratis para tu empresa.',
    intro:
      'Di qué hay que limpiar, los metros y la frecuencia. Te contactan empresas de aseo que atienden tu comuna. Cotizar no cuesta.',
    queIncluye: ['Aseo de oficinas', 'Aseo industrial y bodegas', 'Edificios y locales'],
  },
  'control-de-plagas': {
    h1: 'Control de plagas para empresas',
    title: 'Control de plagas para empresas',
    description:
      'Cotiza desratización, desinsectación o sanitización en tu comuna. Una solicitud. Gratis.',
    intro:
      'Di qué plaga viste y dónde. Te contactan empresas de control de plagas que cubren tu comuna. Mientras antes se trate, más barato sale.',
    queIncluye: ['Roedores', 'Insectos rastreros y termitas', 'Sanitización de recintos'],
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
    }
  )
}

export function copyCombo(args: {
  slugBd: string
  nombreRubro: string
  nombrePlural: string
  comuna: string
  region: string
  provincia: string
}): { h1: string; intro: string; porQue: string; description: string } {
  const fijo = COPY_RUBRO[args.slugBd]
  const servicio = (fijo?.h1 ?? args.nombrePlural).replace(/ para tu empresa$/i, '')
  const h1 = `${args.nombrePlural} en ${args.comuna}`
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
  const description = `Cotiza ${servicio.toLowerCase()} en ${args.comuna}. Una solicitud, empresas de ${args.region} te contactan. Gratis.`
  return { h1, intro, porQue, description }
}

export function atajosHome(): Array<{ href: string; etiqueta: string }> {
  return [
    { href: pathPublicoRubro('seguridad'), etiqueta: 'Seguridad' },
    { href: pathPublicoRubro('aseo'), etiqueta: 'Aseo' },
    { href: pathPublicoRubro('control-de-plagas'), etiqueta: 'Plagas' },
  ]
}
