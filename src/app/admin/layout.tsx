import type { Metadata } from 'next'

import { NavAdmin } from '@/components/admin/nav-admin'
import { ForzarTemaDia } from '@/components/sitio/forzar-tema-dia'

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * El panel vive en /admin. Cada página valida el rol ADMIN en servidor
 * (src/server/sesion.ts). Este layout no hace de guardia: solo pone la
 * carcasa, sin cabecera ni pie comerciales del sitio público.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 text-(--color-tinta)">
      <ForzarTemaDia />
      <NavAdmin />
      {children}
    </div>
  )
}
