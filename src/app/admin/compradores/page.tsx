import Link from 'next/link'

import { AccionesRapidasLead } from '@/app/admin/acciones-rapidas'
import { ReversaCompra } from '@/app/admin/compradores/reversa-compra'
import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

export default async function AdminCompradores() {
  await requerirAdmin()

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      estado: true,
      rutValido: true,
      telefonoVerificado: true,
      rubro: { select: { nombre: true } },
      comuna: { select: { nombre: true } },
      contacto: { select: { razonSocial: true, rutNormalizado: true } },
      compras: {
        where: { estado: 'PAGADA' },
        select: { id: true, tipo: true, proveedor: { select: { nombre: true } } },
      },
    },
  })

  return (
    <>
      <h1 className="text-2xl font-semibold">Compradores</h1>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        Acá sí se ve el contacto. El proveedor, no: solo después de pagar.
      </p>

      {leads.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-(--color-borde) bg-white p-5">
          Todavía no hay cotizaciones.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-2xl border border-(--color-borde) bg-white p-5">
              <p className="font-medium">{lead.contacto?.razonSocial ?? 'Sin razón social'}</p>
              <p className="text-sm text-(--color-tinta-suave)">
                {lead.rubro.nombre} · {lead.comuna.nombre} · {lead.estado}
              </p>
              <p className="mt-1 text-sm">
                RUT {lead.rutValido ? 'ok' : '—'}
                {lead.contacto ? ` ${formatearRut(lead.contacto.rutNormalizado)}` : ''} · Tel{' '}
                {lead.telefonoVerificado ? 'ok' : '—'}
              </p>
              <p className="mt-1 text-sm text-(--color-tinta-suave)">
                {lead.compras.length === 0
                  ? 'Nadie lo tomó'
                  : `Lo tomó: ${lead.compras.map((c) => `${c.proveedor.nombre} (${c.tipo})`).join(', ')}`}
              </p>
              <AccionesRapidasLead
                leadId={lead.id}
                estado={lead.estado}
                rutValido={lead.rutValido}
                telefonoVerificado={lead.telefonoVerificado}
              />
              {lead.compras.map((compra) => (
                <ReversaCompra key={compra.id} compraId={compra.id} />
              ))}
              <Link href={rutaAdmin(`leads/${lead.id}`)} className="mt-2 inline-block text-sm underline">
                Ver ficha
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
