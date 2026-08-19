import Image from 'next/image'

import { monogramaProveedor, urlLogoVisible } from '@/lib/logo-proveedor'

const TAMANOS = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
} as const

export function LogoProveedor({
  nombre,
  logoUrl,
  tamano = 'md',
  className = '',
}: {
  nombre: string
  logoUrl?: string | null
  tamano?: keyof typeof TAMANOS
  className?: string
}) {
  const caja = TAMANOS[tamano]
  const mono = monogramaProveedor(nombre)
  const src = urlLogoVisible(logoUrl)

  if (src) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-2xl border border-(--color-borde) bg-white ${caja} ${className}`}
      >
        <Image src={src} alt={`Logo de ${nombre}`} fill sizes="80px" className="object-contain p-1" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl border border-(--color-borde) bg-(--color-superficie-2) font-semibold text-(--color-tinta) ${caja} ${className}`}
    >
      {mono}
    </span>
  )
}
