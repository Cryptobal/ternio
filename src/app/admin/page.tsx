import Link from 'next/link'
import { EstadoLead } from '@prisma/client'

import { rutaAdmin } from '@/lib/admin-ruta'
import { embudo, leadsPorEstado } from '@/lib/metricas'
import { prisma } from '@/lib/prisma'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

const DIAS_VENTANA = 30

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const porcentaje = (valor: number): string => `${(valor * 100).toFixed(1)}%`

function Tarjeta({ titulo, valor, pie }: { titulo: string; valor: string; pie?: string }) {
  return (
    <div className="rounded-xl border border-(--color-borde) bg-white p-4">
      <p className="text-sm text-(--color-tinta-suave)">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {pie ? <p className="mt-1 text-xs text-(--color-tinta-suave)">{pie}</p> : null}
    </div>
  )
}

export default async function AdminInicio() {
  await requerirAdmin()

  const desde = new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000)

  const [pasos, porEstado, cola, demandaPendiente] = await Promise.all([
    embudo(desde),
    leadsPorEstado(desde),
    prisma.lead.findMany({
      where: { estado: { in: [EstadoLead.RECIBIDO, EstadoLead.EN_REVISION] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        estado: true,
        score: true,
        createdAt: true,
        telefonoVerificado: true,
        compradorUsuarioId: true,
        rubro: { select: { nombre: true } },
        comuna: { select: { nombre: true } },
      },
    }),
    prisma.solicitudRubro.count(),
  ])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Panel</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href={rutaAdmin('compradores')} className="underline underline-offset-4">
            Todas las cotizaciones
          </Link>
          <Link href={rutaAdmin('demanda')} className="underline underline-offset-4">
            Demanda de rubros ({demandaPendiente})
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Embudo de los últimos {DIAS_VENTANA} días
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta titulo="Visitas" valor={String(pasos.visitas)} />
          <Tarjeta titulo="Formularios iniciados" valor={String(pasos.iniciosFormulario)} />
          <Tarjeta
            titulo="Cotizaciones creadas"
            valor={String(pasos.leadsCreados)}
            pie={`${porcentaje(pasos.conversionVisitaLead)} de las visitas`}
          />
          <Tarjeta
            titulo="Cuentas creadas"
            valor={String(pasos.cuentasCreadas)}
            pie={`${porcentaje(pasos.conversionLeadCuenta)} de las cotizaciones`}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(porEstado).map(([estado, cantidad]) => (
            <Tarjeta key={estado} titulo={estado} valor={String(cantidad)} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Cola de revisión</h2>
        <p className="mt-1 text-sm text-(--color-tinta-suave)">
          Cotizaciones esperando revisión. Las de rubros en modo captura no aparecen acá: quedan
          en lista de espera y no se venden.
        </p>

        {cola.length === 0 ? (
          <p className="mt-4 rounded-xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
            No hay cotizaciones pendientes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-(--color-borde) bg-white">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="border-b border-(--color-borde) text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Recibida</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Comuna</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Cuenta</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {cola.map((lead) => (
                  <tr key={lead.id} className="border-b border-(--color-borde) last:border-0">
                    <td className="px-4 py-3">{formatoFechaHora.format(lead.createdAt)}</td>
                    <td className="px-4 py-3">{lead.rubro.nombre}</td>
                    <td className="px-4 py-3">{lead.comuna.nombre}</td>
                    <td className="px-4 py-3">{lead.score}</td>
                    <td className="px-4 py-3">{lead.compradorUsuarioId ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3">{lead.telefonoVerificado ? 'Verificado' : '—'}</td>
                    <td className="px-4 py-3">{lead.estado}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={rutaAdmin(`leads/${lead.id}`)}
                        className="underline underline-offset-4"
                      >
                        Ver
                      </Link>
                    </td>
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
