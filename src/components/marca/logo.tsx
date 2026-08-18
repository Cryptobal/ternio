import { type SVGProps } from 'react'

type Variante = 'claro' | 'oscuro'

const PODIO = {
  viewBox: '0 0 32 32',
  laterales: [
    { x: 2.5, y: 13, width: 7.5, height: 16.5 },
    { x: 22, y: 18.5, width: 7.5, height: 11 },
  ],
  centro: { x: 12.2, y: 4.5, width: 7.5, height: 25 },
  rx: 2.6,
} as const

function colorLateral(variante: Variante): string {
  return variante === 'oscuro' ? '#FFFFFF' : '#14385E'
}

export function Isotipo({
  variante = 'claro',
  className,
  ...props
}: SVGProps<SVGSVGElement> & { variante?: Variante }) {
  const lateral = colorLateral(variante)

  return (
    <svg
      viewBox={PODIO.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {PODIO.laterales.map((rect) => (
        <rect key={`${rect.x}-${rect.y}`} {...rect} rx={PODIO.rx} fill={lateral} />
      ))}
      <rect {...PODIO.centro} rx={PODIO.rx} fill="#FFAB1A" />
    </svg>
  )
}

export function Logo({
  variante = 'claro',
  className,
}: {
  variante?: Variante
  className?: string
}) {
  const wordmark = variante === 'oscuro' ? 'text-white' : 'text-(--color-marca)'

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Isotipo variante={variante} className="size-8 shrink-0" />
      <span className={`font-display text-[1.35rem] leading-none ${wordmark}`}>ternio</span>
    </span>
  )
}
