import Link from 'next/link'

import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short' })

/**
 * Demanda de rubros que todavía no cubrimos ("Otro servicio" del cotizador y,
 * más adelante, solicitudes de proveedores). Esta tabla es la que decide qué
 * rubro se abre después.
 */
export default async function Demanda() {
  await requerirAdmin()

  const [solicitudes, leadsEnEspera] = await Promise.all([
    prisma.solicitudRubro.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        textoRubro: true,
        origen: true,
        createdAt: true,
        comuna: { select: { nombre: true } },
        usuario: { select: { email: true } },
      },
    }),
    prisma.lead.groupBy({
      by: ['rubroId'],
      where: { estado: 'LISTA_ESPERA' },
      _count: { _all: true },
    }),
  ])

  const rubros = await prisma.rubro.findMany({
    where: { id: { in: leadsEnEspera.map((fila) => fila.rubroId) } },
    select: { id: true, nombre: true },
  })
  const nombrePorRubro = new Map(rubros.map((rubro) => [rubro.id, rubro.nombre]))

  return (
    <>
      <Link href={rutaAdmin()} className="text-sm underline underline-offset-4">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Demanda de rubros</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Lista de espera por rubro en captura</h2>
        {leadsEnEspera.length === 0 ? (
          <p className="mt-3 rounded-xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
            Todavía no hay cotizaciones en lista de espera.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leadsEnEspera.map((fila) => (
              <li
                key={fila.rubroId}
                className="rounded-xl border border-(--color-borde) bg-white p-4"
              >
                <p className="text-sm text-(--color-tinta-suave)">
                  {nombrePorRubro.get(fila.rubroId) ?? fila.rubroId}
                </p>
                <p className="mt-1 text-2xl font-semibold">{fila._count._all}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Servicios que nos pidieron</h2>
        {solicitudes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
            Nadie ha pedido un servicio fuera del catálogo todavía.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-(--color-borde) bg-white">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-b border-(--color-borde) text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Servicio pedido</th>
                  <th className="px-4 py-3 font-medium">Comuna</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="border-b border-(--color-borde) last:border-0">
                    <td className="px-4 py-3">{formatoFecha.format(solicitud.createdAt)}</td>
                    <td className="px-4 py-3">{solicitud.textoRubro}</td>
                    <td className="px-4 py-3">{solicitud.comuna?.nombre ?? '—'}</td>
                    <td className="px-4 py-3">{solicitud.origen}</td>
                    <td className="px-4 py-3">{solicitud.usuario?.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
