import type { Metadata } from 'next'
import Link from 'next/link'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Ternio — cotiza servicios para tu empresa',
    template: '%s | Ternio',
  },
  description:
    'Cuéntanos qué necesita tu empresa y te contactan proveedores de tu comuna. Cotizar es gratis.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="flex min-h-screen flex-col antialiased">
        <header className="border-b border-(--color-borde) bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-(--color-marca)">
              Ternio
            </Link>
            <nav className="text-sm">
              <Link
                href="/mis-cotizaciones"
                className="text-(--color-tinta-suave) underline-offset-4 hover:underline"
              >
                Mis cotizaciones
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-(--color-borde) bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-(--color-tinta-suave)">
            <p>Ternio — cotiza servicios para tu empresa. Cotizar es gratis.</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/privacidad" className="underline underline-offset-4">
                Política de privacidad
              </Link>
              <Link href="/terminos" className="underline underline-offset-4">
                Términos de uso
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
