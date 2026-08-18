import Link from 'next/link'

import { Isotipo, Logo } from '@/components/marca/logo'

export function CabeceraPublica() {
  return (
    <header className="sticky top-0 z-20 bg-(--color-tinta)/95 text-white backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Ternio, ir al inicio">
          <Logo variante="oscuro" />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-white/90 underline-offset-4 transition hover:text-white hover:underline"
          >
            Ya cotizé
          </Link>
          <Link
            href="/proveedores"
            className="inline-flex min-h-11 items-center rounded-full border border-(--color-ambar) px-4 py-2 text-sm font-semibold text-(--color-ambar) transition hover:bg-(--color-ambar) hover:text-(--color-tinta)"
          >
            Soy proveedor
          </Link>
        </div>
      </div>
    </header>
  )
}

export function PiePublico() {
  return (
    <footer className="border-t border-(--color-linea) bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-(--color-tinta-suave)">
          <Isotipo variante="claro" className="size-7" />
          <p>
            <span className="font-medium text-(--color-tinta)">ternio.cl</span>
            <span aria-hidden="true"> · </span>
            <Link href="/terminos" className="underline-offset-4 hover:underline">
              Términos
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/privacidad" className="underline-offset-4 hover:underline">
              Privacidad
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/blog" className="underline-offset-4 hover:underline">
              Blog
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/entrar" className="underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
        <p className="text-xs text-(--color-tinta-suave)">
          Tratamos tus datos conforme a la Ley 21.719.
        </p>
      </div>
    </footer>
  )
}

export function MarcoPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraPublica />
      <main className="flex-1">{children}</main>
      <PiePublico />
    </div>
  )
}
