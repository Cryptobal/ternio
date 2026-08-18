import Link from 'next/link'

import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { CLASE_SUPERFICIE } from '@/lib/ui'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

export default async function AdminRubros() {
  await requerirAdmin()
  const rubros = await prisma.rubro.findMany({
    orderBy: [{ activo: 'desc' }, { orden: 'asc' }],
    select: {
      id: true,
      slug: true,
      nombre: true,
      modo: true,
      activo: true,
      precioExclusivoClp: true,
      precioCompartidoClp: true,
    },
  })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Rubros</h1>
          <p className="mt-2 text-sm text-(--color-tinta-suave)">
            Un rubro en VENTA con precios aparece solo en el cotizador y en /proveedores.
            No se borra: se desactiva.
          </p>
        </div>
        <Link
          href={rutaAdmin('rubros/nuevo')}
          className="inline-flex min-h-11 items-center rounded-2xl bg-(--color-marca) px-4 py-2 text-sm font-semibold text-white"
        >
          Nuevo rubro
        </Link>
      </div>

      <ul className="mt-8 grid gap-3">
        {rubros.map((rubro) => (
          <li key={rubro.id} className={CLASE_SUPERFICIE}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{rubro.nombre}</p>
                <p className="mt-1 text-sm text-(--color-tinta-suave)">
                  /{rubro.slug} · {rubro.modo}
                  {rubro.activo ? '' : ' · inactivo'}
                  {rubro.modo === 'VENTA'
                    ? ` · excl. $${rubro.precioExclusivoClp ?? 0} / comp. $${rubro.precioCompartidoClp ?? 0}`
                    : ''}
                </p>
              </div>
              <Link
                href={rutaAdmin(`rubros/${rubro.id}`)}
                className="text-sm font-medium underline underline-offset-4"
              >
                Editar
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
