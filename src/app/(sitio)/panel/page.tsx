import type { Metadata } from 'next'
import Link from 'next/link'

import { MarcarContactado } from '@/app/(sitio)/panel/marcar-contactado'
import { PacksCreditos } from '@/app/(sitio)/panel/packs'
import { TomarLead } from '@/app/(sitio)/panel/tomar-lead'
import { FormularioCambiarPassword } from '@/components/panel/formulario-cambiar-password'
import { FichaLead } from '@/components/panel/ficha-lead'
import { etiquetaModoCobertura, leerSnapshotCobertura, textoCobertura } from '@/lib/cobertura'
import { formatearClp } from '@/lib/dinero'
import { flowConfigurado } from '@/lib/flow'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { formatearTelefono } from '@/lib/telefono'
import { CLASE_SUPERFICIE } from '@/lib/ui'
import { activarProveedorTrasOtp } from '@/server/creditos'
import { salir } from '@/server/auth-acciones'
import { capacidadesDe } from '@/server/capacidades'
import { cargarPanelProveedor, type MovimientoPanel } from '@/server/marketplace'
import { requerirProveedor } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Tu cuenta de proveedor',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Vista = 'disponibles' | 'tomados' | 'movimientos'

const fmtFecha = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function etiquetaTipoMovimiento(tipo: MovimientoPanel['tipo']): string {
  switch (tipo) {
    case 'COMPRA_PACK':
      return 'Pack'
    case 'CONSUMO_LEAD':
      return 'Compra'
    case 'REVERSA':
      return 'Reversa'
    case 'AJUSTE':
      return 'Ajuste'
    default:
      return tipo
  }
}

export default async function PanelProveedor({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string; vista?: string; rubro?: string }>
}) {
  const sesion = await requerirProveedor()
  const { pago, vista: vistaBruta, rubro: rubroFiltro } = await searchParams
  const vista: Vista =
    vistaBruta === 'tomados' || vistaBruta === 'movimientos' ? vistaBruta : 'disponibles'
  const pagosListos = flowConfigurado()

  await activarProveedorTrasOtp(sesion.user.id)
  const [caps, usuarioAuth, panel] = await Promise.all([
    capacidadesDe(sesion.user.id),
    prisma.user.findUnique({
      where: { id: sesion.user.id },
      select: { passwordHash: true },
    }),
    cargarPanelProveedor(sesion.user.id),
  ])
  const {
    proveedor,
    saldo,
    disponibles,
    tomados,
    movimientos,
    gastoMesClp,
    comprasMes,
    contactadosMes,
  } = panel
  const sinPassword = !usuarioAuth?.passwordHash
  const enlaceCotizaciones = caps.tieneCotizaciones

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

  const rubrosEnLista = [...new Set(disponibles.map((lead) => lead.rubroSlug))]
  const disponiblesFiltrados = rubroFiltro
    ? disponibles.filter((lead) => lead.rubroSlug === rubroFiltro)
    : disponibles

  const tasaContacto =
    comprasMes > 0 ? `${Math.round((contactadosMes / comprasMes) * 100)}%` : '—'

  const hrefVista = (v: Vista, rubro?: string) => {
    const params = new URLSearchParams()
    if (v !== 'disponibles') params.set('vista', v)
    if (rubro) params.set('rubro', rubro)
    const q = params.toString()
    return q ? `/panel?${q}` : '/panel'
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-end gap-4">
        {enlaceCotizaciones ? (
          <Link
            href="/mis-cotizaciones"
            className="text-sm underline underline-offset-4"
          >
            Ver mis cotizaciones
          </Link>
        ) : null}
        <form action={salir}>
          <button type="submit" className="text-sm underline underline-offset-4">
            Cerrar sesión
          </button>
        </form>
      </div>

      {sinPassword ? (
        <p
          role="status"
          className="mt-4 rounded-2xl border border-(--color-ambar) bg-(--color-ambar-suave) px-4 py-3 text-sm"
        >
          Crea una contraseña para entrar sin depender del SMS.
        </p>
      ) : null}

      <header className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">{cobertura}</p>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl">{proveedor.nombre}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-right">
            <span className="block text-2xl font-semibold">{formatearClp(saldo)}</span>
            <span className="text-sm text-(--color-tinta-suave)">créditos</span>
          </p>
          <a
            href="#recargar"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-(--color-borde) bg-white px-4 py-2 text-sm font-semibold transition hover:border-(--color-marca)"
          >
            Recargar
          </a>
        </div>
      </header>

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

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi etiqueta="Saldo" valor={formatearClp(saldo)} />
        <Kpi etiqueta="Gasto del mes" valor={formatearClp(gastoMesClp)} />
        <Kpi etiqueta="Contactos del mes" valor={String(comprasMes)} />
        <Kpi etiqueta="Tasa de contacto" valor={tasaContacto} />
      </section>

      <nav className="mt-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(
          [
            ['disponibles', 'Disponibles'],
            ['tomados', 'Mis contactos'],
            ['movimientos', 'Movimientos'],
          ] as const
        ).map(([id, label]) => {
          const activa = vista === id
          return (
            <Link
              key={id}
              href={hrefVista(id, id === 'disponibles' ? rubroFiltro : undefined)}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                activa
                  ? 'bg-(--color-tinta) text-white'
                  : 'border border-(--color-borde) bg-white hover:border-(--color-marca)'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {vista === 'disponibles' ? (
        <section className="mt-6">
          {rubrosEnLista.length > 1 ? (
            <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
              <Link
                href={hrefVista('disponibles')}
                className={`shrink-0 rounded-2xl px-3 py-2 text-sm ${
                  !rubroFiltro
                    ? 'bg-(--color-ambar-suave) font-medium'
                    : 'border border-(--color-borde) bg-white'
                }`}
              >
                Todos
              </Link>
              {rubrosEnLista.map((slug) => {
                const nombre = disponibles.find((l) => l.rubroSlug === slug)?.rubro ?? slug
                return (
                  <Link
                    key={slug}
                    href={hrefVista('disponibles', slug)}
                    className={`shrink-0 rounded-2xl px-3 py-2 text-sm ${
                      rubroFiltro === slug
                        ? 'bg-(--color-ambar-suave) font-medium'
                        : 'border border-(--color-borde) bg-white'
                    }`}
                  >
                    {nombre}
                  </Link>
                )
              })}
            </div>
          ) : null}

          {disponiblesFiltrados.length === 0 ? (
            <p className="rounded-2xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
              {rubroFiltro
                ? 'No hay compradores de ese rubro en tu cobertura ahora.'
                : 'No hay compradores en tu cobertura ahora.'}
            </p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {disponiblesFiltrados.map((lead) => (
                <li key={lead.id}>
                  <FichaLead lead={lead}>
                    <TomarLead lead={lead} saldo={saldo} />
                  </FichaLead>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {vista === 'tomados' ? (
        <section className="mt-6">
          {tomados.length === 0 ? (
            <p className="text-sm text-(--color-tinta-suave)">Todavía no tomas ningún contacto.</p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {tomados.map((lead) => (
                <li key={lead.compraId} className={`${CLASE_SUPERFICIE} border-(--color-verde)/40`}>
                  <p className="text-sm font-medium text-(--color-verde)">
                    {lead.tipo === 'EXCLUSIVO' ? 'Exclusivo' : 'Compartido'} ·{' '}
                    {formatearClp(lead.precioClp)}
                  </p>
                  <p className="mt-1 font-medium">
                    {lead.rubro} · {lead.comuna}
                  </p>
                  <p className="mt-1 text-xs text-(--color-tinta-suave)">
                    Comprado el {fmtFecha.format(lead.compradoAt)}
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
                  <MarcarContactado compraId={lead.compraId} contactadoEn={lead.contactadoEn} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {vista === 'movimientos' ? (
        <section className="mt-6">
          <p className="mb-3 text-sm text-(--color-tinta-suave)">
            El saldo es la suma exacta de estos asientos.
          </p>
          {movimientos.length === 0 ? (
            <p className="rounded-2xl border border-(--color-borde) bg-white p-5 text-sm text-(--color-tinta-suave)">
              Todavía no hay movimientos en tu ledger.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-(--color-borde) bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-(--color-borde) text-(--color-tinta-suave)">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium text-right">Monto</th>
                    <th className="px-4 py-3 font-medium text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id} className="border-b border-(--color-borde)/60 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">{fmtFecha.format(mov.createdAt)}</td>
                      <td className="px-4 py-3">{mov.descripcion ?? '—'}</td>
                      <td className="px-4 py-3">{etiquetaTipoMovimiento(mov.tipo)}</td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right ${
                          mov.montoCreditos < 0 ? 'text-(--color-rojo)' : 'text-(--color-verde)'
                        }`}
                      >
                        {mov.montoCreditos > 0 ? '+' : ''}
                        {formatearClp(mov.montoCreditos)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                        {formatearClp(mov.saldoPosterior)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <div className="mt-10">
        <PacksCreditos pagosListos={pagosListos} />
      </div>

      <FormularioCambiarPassword sinPassword={sinPassword} />
    </div>
  )
}

function Kpi({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-(--color-borde) bg-white p-4">
      <p className="text-xs text-(--color-tinta-suave)">{etiqueta}</p>
      <p className="mt-1 font-display text-xl sm:text-2xl">{valor}</p>
    </div>
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
