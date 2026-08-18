'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { rutaAdmin } from '@/lib/admin-ruta'
import { salir } from '@/server/auth-acciones'

const ENLACES = [
  { href: rutaAdmin(), etiqueta: 'Panel' },
  { href: rutaAdmin('compradores'), etiqueta: 'Compradores' },
  { href: rutaAdmin('proveedores'), etiqueta: 'Proveedores' },
  { href: rutaAdmin('demanda'), etiqueta: 'Demanda' },
  { href: rutaAdmin('rubros'), etiqueta: 'Rubros' },
]

export function NavAdmin() {
  const path = usePathname()
  if (path === rutaAdmin('ingresar')) return null

  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-(--color-borde) pb-4">
      <ul className="flex flex-wrap gap-4 text-sm">
        {ENLACES.map((enlace) => {
          const activo =
            path === enlace.href ||
            (enlace.href !== rutaAdmin() && path.startsWith(`${enlace.href}/`))
          return (
            <li key={enlace.href}>
              <Link
                href={enlace.href}
                className={
                  activo
                    ? 'font-semibold text-(--color-tinta)'
                    : 'text-(--color-tinta-suave) underline-offset-4 hover:underline'
                }
              >
                {enlace.etiqueta}
              </Link>
            </li>
          )
        })}
      </ul>
      <form action={salir}>
        <button type="submit" className="text-sm text-(--color-tinta-suave) underline underline-offset-4">
          Salir
        </button>
      </form>
    </nav>
  )
}
