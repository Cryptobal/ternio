import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AccionesLead } from '@/app/admin/leads/[id]/acciones-lead'
import { rutaAdmin } from '@/lib/admin-ruta'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { formatearTelefono } from '@/lib/telefono'
import { ETIQUETA_AUDIENCIA, parsearAudiencia } from '@/lib/audiencia'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-(--color-tinta-suave)">{etiqueta}</dt>
      <dd className="font-medium break-words">{valor}</dd>
    </div>
  )
}

export default async function DetalleLead({ params }: Props) {
  await requerirAdmin()
  const { id } = await params

  // El admin sí ve el contacto: es quien revisa y verifica los leads.
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      score: true,
      datos: true,
      createdAt: true,
      rutValido: true,
      telefonoVerificado: true,
      whatsappOptIn: true,
      modoRubroAlCrear: true,
      audiencia: true,
      compradorUsuarioId: true,
      rubro: { select: { nombre: true, modo: true } },
      comuna: { select: { nombre: true } },
      comprador: { select: { email: true } },
      contacto: true,
      transiciones: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!lead) notFound()

  const datos = (lead.datos ?? {}) as Record<string, string>
  const audienciaLead = parsearAudiencia(lead.audiencia)

  return (
    <>
      <Link href={rutaAdmin()} className="text-sm underline underline-offset-4">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">
        {lead.rubro.nombre} en {lead.comuna.nombre}
      </h1>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        Recibida el {formatoFechaHora.format(lead.createdAt)} · Estado {lead.estado} · Score{' '}
        {lead.score} · Rubro en modo {lead.modoRubroAlCrear} al crearse
        {audienciaLead ? ` · ${ETIQUETA_AUDIENCIA[audienciaLead]}` : ''}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-(--color-borde) bg-white p-5">
          <h2 className="font-semibold">Contacto</h2>
          <dl className="mt-3 space-y-3">
            <Dato etiqueta="Nombre" valor={lead.contacto?.nombreContacto ?? '—'} />
            <Dato etiqueta="Correo" valor={lead.contacto?.email ?? '—'} />
            <Dato
              etiqueta="Teléfono"
              valor={
                lead.contacto ? formatearTelefono(lead.contacto.telefonoE164) : '—'
              }
            />
            <Dato
              etiqueta="RUT"
              valor={lead.contacto ? formatearRut(lead.contacto.rutNormalizado) : '—'}
            />
            <Dato etiqueta="Razón social" valor={lead.contacto?.razonSocial ?? '—'} />
            <Dato
              etiqueta="Cuenta del comprador"
              valor={lead.comprador?.email ?? 'Sin cuenta todavía'}
            />
            <Dato etiqueta="Opt-in WhatsApp" valor={lead.whatsappOptIn ? 'Sí' : 'No'} />
          </dl>

          {lead.contacto?.detalle ? (
            <div className="mt-4">
              <p className="text-sm text-(--color-tinta-suave)">Detalle que escribió</p>
              <p className="mt-1 whitespace-pre-line">{lead.contacto.detalle}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-(--color-borde) bg-white p-5">
          <h2 className="font-semibold">Respuestas del formulario</h2>
          {Object.keys(datos).length === 0 ? (
            <p className="mt-3 text-(--color-tinta-suave)">Sin respuestas.</p>
          ) : (
            <dl className="mt-3 space-y-3">
              {Object.entries(datos).map(([clave, valor]) => (
                <Dato key={clave} etiqueta={clave} valor={String(valor)} />
              ))}
            </dl>
          )}
        </section>
      </div>

      <section className="mt-6">
        <AccionesLead leadId={lead.id} telefonoVerificado={lead.telefonoVerificado} />
      </section>

      <section className="mt-6 rounded-xl border border-(--color-borde) bg-white p-5">
        <h2 className="font-semibold">Historial</h2>
        <ol className="mt-3 space-y-3">
          {lead.transiciones.map((transicion) => (
            <li key={transicion.id} className="text-sm">
              <span className="text-(--color-tinta-suave)">
                {formatoFechaHora.format(transicion.createdAt)} · {transicion.actor}
              </span>
              <span className="ml-2 font-medium">{transicion.tipo}</span>
              <span className="ml-2 text-(--color-tinta-suave)">
                {transicion.estadoDesde ?? '—'} → {transicion.estadoHasta}
              </span>
              {transicion.nota ? <p className="mt-1">{transicion.nota}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
