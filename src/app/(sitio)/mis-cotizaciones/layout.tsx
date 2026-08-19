import { ForzarTemaDia } from '@/components/sitio/forzar-tema-dia'

export default function MisCotizacionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForzarTemaDia />
      {children}
    </>
  )
}
