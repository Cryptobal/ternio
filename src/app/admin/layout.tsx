import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * El panel solo se sirve por rewrite desde {ADMIN_PATH} y cada página valida
 * el rol ADMIN en servidor (src/server/sesion.ts). Este layout no hace de
 * guardia: solo pone la carcasa.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
}
