import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { FormularioOtpEntrar } from '@/components/formulario-otp'
import { sesionActual } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entra a Ternio con el teléfono que usaste al cotizar.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function Entrar() {
  const sesion = await sesionActual()
  if (sesion?.user?.id) redirect('/mis-cotizaciones')

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl">Entra con tu teléfono</h1>
      <p className="mt-3 text-(--color-tinta-suave)">
        Te enviamos un código de un solo uso. Sin contraseña. Si ya cotizaste, retomas esas
        solicitudes.
      </p>
      <FormularioOtpEntrar />
    </div>
  )
}
