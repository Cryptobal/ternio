import Link from 'next/link'

import { LogoProveedor } from '@/components/marca/logo-proveedor'
import type { ProveedorPublicoResumen } from '@/server/proveedores-publicos'

export function ListadoProveedoresZona({
  comunaNombre,
  proveedores,
}: {
  comunaNombre: string
  proveedores: readonly ProveedorPublicoResumen[]
}) {
  if (proveedores.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl">Proveedores en {comunaNombre}</h2>
      <p className="mt-1 text-sm text-(--color-texto-suave)">
        Empresas que cubren esta comuna. Tú eliges a quién cotizar; ellos te contactan si toman
        tu solicitud.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {proveedores.map((proveedor) => (
          <li key={proveedor.slug}>
            <Link
              href={proveedor.path}
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-(--color-borde) bg-(--color-superficie) p-3 transition hover:border-(--color-boton)"
            >
              <LogoProveedor nombre={proveedor.nombre} logoUrl={proveedor.logoUrl} tamano="sm" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-(--color-texto)">
                  {proveedor.nombre}
                </span>
                {proveedor.descripcion ? (
                  <span className="mt-0.5 line-clamp-2 text-sm text-(--color-texto-suave)">
                    {proveedor.descripcion}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
