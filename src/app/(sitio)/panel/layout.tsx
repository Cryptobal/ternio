import { ForzarTemaDia } from '@/components/sitio/forzar-tema-dia'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForzarTemaDia />
      {children}
    </>
  )
}
