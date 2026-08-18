import { EstadoLead, EstadoProveedor, ModoRubro } from '@prisma/client'

import { AccionesRapidasLead } from '@/app/admin/acciones-rapidas'
import { AccionesProveedor } from '@/app/admin/proveedores/acciones-proveedor'
import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { ensureGardSecurity } from '@/server/gard'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

function Numero({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl border border-(--color-borde) bg-white p-5 shadow-[0_12px_32px_-20px_rgb(14_27_44/0.18)]">
      <p className="text-sm text-(--color-tinta-suave)">{titulo}</p>
      <p className="mt-1 text-4xl font-semibold">{valor}</p>
    </div>
  )
}

export default async function AdminInicio() {
  await requerirAdmin()
  await ensureGardSecurity()

  const [porRevisar, proveedoresNuevos, aLaVenta, pendientes, ultimos] = await Promise.all([
    prisma.lead.count({
      where: { estado: { in: [EstadoLead.RECIBIDO, EstadoLead.EN_REVISION] } },
    }),
    prisma.proveedor.count({
      where: { estado: EstadoProveedor.PENDIENTE, usuarioId: { not: null } },
    }),
    prisma.lead.count({
      where: {
        estado: EstadoLead.VERIFICADO,
        modoRubroAlCrear: ModoRubro.VENTA,
        rutValido: true,
        telefonoVerificado: true,
      },
    }),
    prisma.proveedor.findMany({
      where: { estado: EstadoProveedor.PENDIENTE, usuarioId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, nombre: true, estado: true, createdAt: true },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        estado: true,
        rutValido: true,
        telefonoVerificado: true,
        rubro: { select: { nombre: true } },
        comuna: { select: { nombre: true } },
        contacto: { select: { razonSocial: true } },
      },
    }),
  ])

  return (
    <>
      <h1 className="text-2xl font-semibold">Hoy</h1>
      <div className="mt-6 grid gap-3">
        <Numero titulo="Leads por revisar" valor={porRevisar} />
        <Numero titulo="Cuentas nuevas" valor={proveedoresNuevos} />
        <Numero titulo="Leads a la venta" valor={aLaVenta} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Cuentas nuevas</h2>
        {pendientes.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-tinta-suave)">Nadie esperando revisión.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pendientes.map((fila) => (
              <li key={fila.id} className="rounded-2xl border border-(--color-borde) bg-white p-4">
                <p className="font-medium">{fila.nombre}</p>
                <AccionesProveedor proveedorId={fila.id} estado={fila.estado} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Últimos compradores</h2>
        {ultimos.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-tinta-suave)">Aún no hay cotizaciones.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {ultimos.map((lead) => (
              <li key={lead.id} className="rounded-2xl border border-(--color-borde) bg-white p-4">
                <p className="font-medium">
                  {lead.contacto?.razonSocial ?? 'Sin razón social'} · {lead.rubro.nombre}
                </p>
                <p className="text-sm text-(--color-tinta-suave)">
                  {lead.comuna.nombre} · {lead.estado} · RUT {lead.rutValido ? 'ok' : '—'} · Tel{' '}
                  {lead.telefonoVerificado ? 'ok' : '—'}
                </p>
                <AccionesRapidasLead
                  leadId={lead.id}
                  estado={lead.estado}
                  rutValido={lead.rutValido}
                  telefonoVerificado={lead.telefonoVerificado}
                />
                <a href={rutaAdmin(`leads/${lead.id}`)} className="mt-2 inline-block text-sm underline">
                  Ver ficha
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
