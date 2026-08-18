import type { Metadata } from 'next'
import Link from 'next/link'

import { PacksCreditos } from '@/app/(sitio)/panel/packs'
import { TomarLead } from '@/app/(sitio)/panel/tomar-lead'
import { etiquetaModoCobertura, leerSnapshotCobertura, textoCobertura } from '@/lib/cobertura'
import { formatearClp, textoAntiguedad } from '@/lib/dinero'
import { etiquetasVerificacion } from '@/lib/ficha-anonima'
import { flowConfigurado } from '@/lib/flow'
import { formatearRut } from '@/lib/rut'
import { ROLES } from '@/lib/roles'
import { formatearTelefono } from '@/lib/telefono'
import { activarProveedorTrasOtp } from '@/server/creditos'
import { salir } from '@/server/auth-acciones'
import { cargarPanelProveedor } from '@/server/marketplace'
import { sesionParaPanel } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Tu cuenta de proveedor',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function PanelProveedor({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string }>
}) {
  const sesion = await sesionParaPanel()
  const { pago } = await searchParams
  const pagosListos = flowConfigurado()

  if (sesion?.user.rol === ROLES.COMPRADOR) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl">Esta es la cuenta de proveedores</h1>
        <p className="mt-4 text-lg text-(--color-tinta-suave)">
          Con este teléfono cotizas servicios. Para vender contactos, crea una
          cuenta de empresa.
        </p>
        <Link
          href="/proveedores"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-(--color-marca) px-5 py-3 font-semibold text-white"
        >
          Crear cuenta de proveedor
        </Link>
        <p className="mt-4 text-sm">
          <Link href="/mis-cotizaciones" className="underline underline-offset-4">
            Ir a mis cotizaciones
          </Link>
        </p>
      </div>
    )
  }

  if (sesion?.user.rol !== ROLES.PROVEEDOR) {
    return null
  }

  await activarProveedorTrasOtp(sesion.user.id)
  const { proveedor, saldo, disponibles, tomados } = await cargarPanelProveedor(sesion.user.id)

  if (!proveedor) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl">Tu cuenta</h1>
        <p className="mt-4 text-(--color-tinta-suave)">
          No encontramos una empresa ligada a este teléfono.
        </p>
        <Link
          href="/proveedores"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-(--color-marca) px-5 py-3 font-semibold text-white"
        >
          Completar datos
        </Link>
      </div>
    )
  }

  if (proveedor.estado === 'SUSPENDIDO' || proveedor.estado === 'RECHAZADO') {
    return (
      <MarcoPanel>
        <h1 className="font-display text-3xl">{proveedor.nombre}</h1>
        <p className="mt-4 rounded-2xl border border-(--color-borde) bg-white p-5">
          {proveedor.estado === 'SUSPENDIDO'
            ? 'Tu cuenta está suspendida. Escríbenos si esto es un error.'
            : 'No pudimos continuar con esta cuenta.'}
        </p>
      </MarcoPanel>
    )
  }

  if (proveedor.estado !== 'APROBADO') {
    return (
      <MarcoPanel>
        <h1 className="font-display text-3xl">{proveedor.nombre}</h1>
        <p className="mt-6 text-lg">
          Tu cuenta está en revisión. Te avisamos cuando puedas ver compradores.
        </p>
        <p className="mt-3 text-(--color-tinta-suave)">
          Si recién confirmaste el celular, recarga esta página.
        </p>
      </MarcoPanel>
    )
  }

  const snapshot = leerSnapshotCobertura(proveedor.solicitudEspera)
  const cobertura = proveedor.coberturaNacional
    ? 'Todo Chile'
    : snapshot
      ? `${etiquetaModoCobertura(snapshot.modo)} · ${textoCobertura(snapshot)}`
      : 'Tu cobertura'

  return (
    <MarcoPanel>
      <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">{cobertura}</p>
      <h1 className="font-display mt-2 text-3xl">{proveedor.nombre}</h1>
      <p className="mt-3 text-2xl font-semibold">{formatearClp(saldo)}</p>
      <p className="text-sm text-(--color-tinta-suave)">créditos disponibles</p>

      {pago === 'ok' ? (
        <p className="mt-4 rounded-2xl bg-(--color-verde-suave) px-4 py-3 text-sm">
          Pago recibido. Si el saldo no cambió, espera un minuto.
        </p>
      ) : null}
      {pago === 'pendiente' ? (
        <p className="mt-4 rounded-2xl border border-(--color-borde) bg-white px-4 py-3 text-sm">
          Flow todavía no confirma el pago. Si ya pagaste, espera un momento y recarga.
        </p>
      ) : null}
      {pago === 'error' ? (
        <p className="mt-4 rounded-2xl bg-(--color-rojo-suave) px-4 py-3 text-sm">
          El pago no se completó. Puedes reintentar el pack.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl">Compradores disponibles</h2>
        {disponibles.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
            No hay compradores en tu cobertura ahora.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {disponibles.map((lead) => (
              <li key={lead.id} className="rounded-2xl border border-(--color-borde) bg-white p-5">
                <p className="font-medium">
                  {lead.rubro} · {lead.comuna}
                </p>
                <p className="mt-1 text-sm text-(--color-tinta-suave)">
                  {lead.region} · {textoAntiguedad(lead.verificadoAt)}
                </p>
                <p className="mt-2 text-sm">
                  {etiquetasVerificacion(lead).join(' · ') || 'Sin etiquetas'}
                </p>
                <p className="mt-1 text-sm text-(--color-tinta-suave)">
                  {lead.cuposRestantes} {lead.cuposRestantes === 1 ? 'cupo' : 'cupos'} compartidos
                </p>
                <TomarLead lead={lead} saldo={saldo} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Ya tomados</h2>
        {tomados.length === 0 ? (
          <p className="mt-4 text-sm text-(--color-tinta-suave)">Todavía no tomas ningún contacto.</p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {tomados.map((lead) => (
              <li key={lead.id} className="rounded-2xl border border-(--color-verde) bg-white p-5">
                <p className="text-sm font-medium text-(--color-verde)">Ya es tuyo</p>
                <p className="mt-1 font-medium">
                  {lead.rubro} · {lead.comuna}
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-(--color-tinta-suave)">Nombre</dt>
                    <dd>{lead.contacto.nombreContacto}</dd>
                  </div>
                  <div>
                    <dt className="text-(--color-tinta-suave)">Teléfono</dt>
                    <dd>
                      <a href={`tel:${lead.contacto.telefonoE164}`} className="underline">
                        {formatearTelefono(lead.contacto.telefonoE164)}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-(--color-tinta-suave)">Correo</dt>
                    <dd>
                      <a href={`mailto:${lead.contacto.email}`} className="underline">
                        {lead.contacto.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-(--color-tinta-suave)">RUT</dt>
                    <dd>{formatearRut(lead.contacto.rutNormalizado)}</dd>
                  </div>
                  <div>
                    <dt className="text-(--color-tinta-suave)">Razón social</dt>
                    <dd>{lead.contacto.razonSocial ?? '—'}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <PacksCreditos pagosListos={pagosListos} />
      </div>
    </MarcoPanel>
  )
}

function MarcoPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <div className="flex justify-end">
        <form action={salir}>
          <button type="submit" className="text-sm underline underline-offset-4">
            Cerrar sesión
          </button>
        </form>
      </div>
      {children}
    </div>
  )
}
