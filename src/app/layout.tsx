import type { Metadata } from 'next'
import { Archivo, Spline_Sans_Mono } from 'next/font/google'

import { NoscriptGtm } from '@/components/gtm'
import { idContenedorGtm, snippetGtm } from '@/lib/gtm'

import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  axes: ['wdth'],
})

const spline = Spline_Sans_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-spline',
})

const titulo = 'Ternio — cotiza servicios para tu empresa'
const descripcion =
  'Una sola solicitud y hasta tres empresas verificadas te contactan y publican su propuesta. Gratis, sin registro y sin llamadas de más.'

export const metadata: Metadata = {
  title: {
    default: titulo,
    template: '%s | Ternio',
  },
  description: descripcion,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITIO_URL ?? 'https://ternio.cl'),
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'Ternio',
    title: titulo,
    description: descripcion,
  },
  twitter: {
    card: 'summary_large_image',
    title: titulo,
    description: descripcion,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = idContenedorGtm()

  return (
    <html lang="es-CL">
      <head>
        {gtmId ? (
          // Script inline oficial: next/script lo envuelve en un loader y
          // lo deja fuera de <head>, así que el HTML de origen no coincidiría
          // con el snippet que pide Google.
          <script dangerouslySetInnerHTML={{ __html: snippetGtm(gtmId) }} />
        ) : null}
      </head>
      <body className={`${archivo.variable} ${spline.variable} antialiased`}>
        <NoscriptGtm />
        {children}
      </body>
    </html>
  )
}
