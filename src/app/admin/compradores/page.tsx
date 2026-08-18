import Link from 'next/link'

import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { formatearTelefono } from '@/lib/telefono'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function AdminCompradores() {
  await requerirAdmin()

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      estado: true,
      score: true,
      createdAt: true,
      rutValido: true,
      telefonoVerificado: true,
      rubro: { select: { nombre: true } },
      comuna: { select: { nombre: true } },
      contacto: {
        select: {
          nombreContacto: true,
          email: true,
          telefonoE164: true,
          rutNormalizado: true,
          razonSocial: true,
        },
      },
    },
  })

  return (
    <>
      <h1 className="text-2xl font-semibold">Compradores / cotizaciones</h1>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        El admin ve el contacto. Los proveedores no: la ficha anónima se mantiene.
      </p>

      {leads.length === 0 ? (
        <p className="mt-6 rounded-xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
          Todavía no hay cotizaciones.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-(--color-borde) bg-white">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-(--color-borde) text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Recibida</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Empresa / RUT</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Comuna</th>
                <th className="px-4 py-3 font-medium">Verificación</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-(--color-borde) last:border-0">
                  <td className="px-4 py-3">{formatoFechaHora.format(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.contacto?.nombreContacto ?? '—'}</p>
                    <p className="text-(--color-tinta-suave)">{lead.contacto?.email ?? '—'}</p>
                    <p className="text-(--color-tinta-suave)">
                      {lead.contacto ? formatearTelefono(lead.contacto.telefonoE164) : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{lead.contacto?.razonSocial ?? '—'}</p>
                    <p className="text-(--color-tinta-suave)">
                      {lead.contacto ? formatearRut(lead.contacto.rutNormalizado) : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{lead.rubro.nombre}</td>
                  <td className="px-4 py-3">{lead.comuna.nombre}</td>
                  <td className="px-4 py-3">
                    RUT {lead.rutValido ? 'ok' : '—'}
                    <span aria-hidden="true"> · </span>
                    Tel {lead.telefonoVerificado ? 'ok' : '—'}
                  </td>
                  <td className="px-4 py-3">{lead.estado}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={rutaAdmin(`leads/${lead.id}`)} className="underline underline-offset-4">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
