import type { Audiencia } from '@/lib/audiencia'

const POZO_CASA = 'rgb(255 171 26 / 0.22)'
const POZO_EMPRESA = 'rgb(96 165 250 / 0.24)'

export function IconoCasa({ tamano = 28 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5.8 14.1 15.1 6.2a1.5 1.5 0 0 1 1.8 0l9.3 7.9a1.15 1.15 0 0 1-1.5 1.75l-.7-.6v8.9A2.2 2.2 0 0 1 21.8 26H10.2A2.2 2.2 0 0 1 8 23.85v-8.9l-.7.6a1.15 1.15 0 1 1-1.5-1.75Z"
        fill="#FFAB1A"
      />
      <path d="M11 15.4h10v8.4c0 .6-.5 1.1-1.1 1.1h-7.8c-.6 0-1.1-.5-1.1-1.1v-8.4Z" fill="#FFE08A" />
      <rect x="13.9" y="19.1" width="4.2" height="5.8" rx="1" fill="#0E1B2C" />
      <rect x="12" y="16.6" width="2.7" height="2.7" rx=".55" fill="#fff" />
      <rect x="17.3" y="16.6" width="2.7" height="2.7" rx=".55" fill="#fff" />
    </svg>
  )
}

export function IconoEmpresa({ tamano = 28 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="16.2" y="5.2" width="10.4" height="19.2" rx="2.1" fill="#2563EB" />
      <rect x="5.4" y="10" width="12.4" height="14.4" rx="2.1" fill="#60A5FA" />
      <rect x="18.2" y="8" width="2.1" height="2.1" rx=".45" fill="#fff" />
      <rect x="21.6" y="8" width="2.1" height="2.1" rx=".45" fill="#fff" />
      <rect x="18.2" y="12" width="2.1" height="2.1" rx=".45" fill="#fff" />
      <rect x="21.6" y="12" width="2.1" height="2.1" rx=".45" fill="#fff" />
      <rect x="18.2" y="16" width="2.1" height="2.1" rx=".45" fill="#fff" />
      <rect x="21.6" y="16" width="2.1" height="2.1" rx=".45" fill="#fff" />
      <rect x="7.6" y="12.6" width="2.2" height="2.2" rx=".45" fill="#fff" />
      <rect x="11.2" y="12.6" width="2.2" height="2.2" rx=".45" fill="#fff" />
      <rect x="7.6" y="16.4" width="2.2" height="2.2" rx=".45" fill="#fff" />
      <rect x="11.2" y="16.4" width="2.2" height="2.2" rx=".45" fill="#fff" />
      <rect x="9.2" y="20.4" width="4.6" height="4" rx=".8" fill="#0E1B2C" />
      <rect x="4.2" y="24.4" width="23.6" height="2.4" rx="1.1" fill="#1D4ED8" />
    </svg>
  )
}

/** Pozo tintado + glifo relleno. El color no depende de si la tarjeta está activa. */
export function GlifoAudiencia({
  audiencia,
  tamano = 28,
}: {
  audiencia: Audiencia
  tamano?: number
}) {
  const casa = audiencia === 'hogar'
  return (
    <span
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl"
      style={{ background: casa ? POZO_CASA : POZO_EMPRESA }}
    >
      {casa ? <IconoCasa tamano={tamano} /> : <IconoEmpresa tamano={tamano} />}
    </span>
  )
}
