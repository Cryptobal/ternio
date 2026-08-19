import Link from 'next/link'

import { FormularioInversionAds } from '@/app/admin/embudo/formulario-inversion'
import { BloqueTraficoGa4 } from '@/components/admin/trafico-ga4'
import { rutaAdmin } from '@/lib/admin-ruta'
import { formatearClp } from '@/lib/dinero'
import {
  cargarTableroEmbudo,
  RANGOS_EMBUDO,
  SLA_AVISO_MS,
  type FilaCorte,
  type RangoEmbudo,
} from '@/lib/metricas'
import { parsearRango } from '@/lib/metricas-calculo'
import { pathPublicoCombo, pathPublicoRubro } from '@/lib/seo-rutas'
import { cargarTraficoGa4Admin } from '@/server/ga4'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

function pct(valor: number | null): string {
  if (valor === null) return '—'
  return `${(valor * 100).toFixed(1)} %`
}

function msATexto(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function Barra({ valor }: { valor: number | null }) {
  const ancho = valor === null ? 0 : Math.max(0, Math.min(100, valor * 100))
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-(--color-papel)">
      <div
        className="h-full rounded-full bg-(--color-marca)"
        style={{ width: `${ancho}%` }}
        aria-hidden
      />
    </div>
  )
}

function TarjetaPaso({
  etiqueta,
  conteo,
  conversion,
}: {
  etiqueta: string
  conteo: number
  conversion: number | null
}) {
  return (
    <div className="rounded-3xl border border-(--color-borde) bg-white p-4 shadow-[0_12px_32px_-20px_rgb(14_27_44/0.18)]">
      <p className="text-sm text-(--color-tinta-suave)">{etiqueta}</p>
      <p className="mt-1 font-display text-3xl">{conteo.toLocaleString('es-CL')}</p>
      {conversion !== null ? (
        <p className="mt-1 text-xs text-(--color-tinta-suave)">
          {pct(conversion)} desde el paso anterior
        </p>
      ) : (
        <p className="mt-1 text-xs text-(--color-tinta-suave)">Base del embudo</p>
      )}
      <Barra valor={conversion} />
    </div>
  )
}

function TablaCorte({
  filas,
  modo,
}: {
  filas: FilaCorte[]
  modo: 'pagina' | 'rubro'
}) {
  if (filas.length === 0) {
    return (
      <p className="mt-3 text-sm text-(--color-tinta-suave)">
        Todavía no hay visitas registradas en este rango.
      </p>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-(--color-borde) bg-white">
      <table className="min-w-[720px] w-full text-left text-sm">
        <thead className="border-b border-(--color-borde) bg-(--color-papel) text-(--color-tinta-suave)">
          <tr>
            <th className="px-3 py-2 font-medium">{modo === 'pagina' ? 'Página' : 'Rubro'}</th>
            <th className="px-3 py-2 font-medium">Visitas</th>
            <th className="px-3 py-2 font-medium">Inicios</th>
            <th className="px-3 py-2 font-medium">Leads</th>
            <th className="px-3 py-2 font-medium">Verif.</th>
            <th className="px-3 py-2 font-medium">Vendidos</th>
            <th className="px-3 py-2 font-medium">Conv.</th>
            <th className="px-3 py-2 font-medium">Ingresos</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const href =
              modo === 'pagina' && fila.comunaSlug
                ? pathPublicoCombo(fila.rubroSlug, fila.comunaSlug)
                : pathPublicoRubro(fila.rubroSlug)
            const etiqueta =
              modo === 'pagina'
                ? fila.comunaNombre
                  ? `${fila.rubroNombre} / ${fila.comunaNombre}`
                  : fila.rubroNombre
                : fila.rubroNombre
            return (
              <tr key={fila.clave} className="border-b border-(--color-borde) last:border-0">
                <td className="px-3 py-2">
                  <Link href={href} className="underline-offset-4 hover:underline">
                    {etiqueta}
                  </Link>
                </td>
                <td className="px-3 py-2 tabular-nums">{fila.visitas}</td>
                <td className="px-3 py-2 tabular-nums">{fila.inicios}</td>
                <td className="px-3 py-2 tabular-nums">{fila.leads}</td>
                <td className="px-3 py-2 tabular-nums">{fila.verificados}</td>
                <td className="px-3 py-2 tabular-nums">{fila.vendidos}</td>
                <td className="px-3 py-2 tabular-nums">{pct(fila.conversionVisitaLead)}</td>
                <td className="px-3 py-2 tabular-nums">{formatearClp(fila.ingresosClp)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdminEmbudo({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>
}) {
  await requerirAdmin()
  const params = await searchParams
  const rango: RangoEmbudo = parsearRango(params.rango)
  const [tablero, traficoGa4] = await Promise.all([
    cargarTableroEmbudo(rango),
    cargarTraficoGa4Admin(),
  ])

  const slaColor =
    tablero.sla.semaforo === 'verde'
      ? 'text-(--color-verde)'
      : tablero.sla.semaforo === 'ambar'
        ? 'text-(--color-ambar)'
        : tablero.sla.semaforo === 'rojo'
          ? 'text-(--color-rojo)'
          : 'text-(--color-tinta-suave)'

  const goColor =
    tablero.goNoGo.estado === 'verde'
      ? 'text-(--color-verde)'
      : tablero.goNoGo.estado === 'rojo'
        ? 'text-(--color-rojo)'
        : 'text-(--color-tinta-suave)'

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Embudo</h1>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Visitas del embudo son pageviews propias (cada carga de página; el
            id anónimo vive en localStorage). El bloque GA4 es otra fuente: no
            se suman ni se reemplazan.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          {RANGOS_EMBUDO.map((r) => (
            <li key={r.id}>
              <Link
                href={`${rutaAdmin('embudo')}?rango=${r.id}`}
                className={
                  r.id === rango
                    ? 'rounded-full bg-(--color-tinta) px-3 py-1.5 font-medium text-white'
                    : 'rounded-full border border-(--color-borde) px-3 py-1.5 text-(--color-tinta-suave) hover:border-(--color-marca)'
                }
              >
                {r.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <BloqueTraficoGa4 trafico={traficoGa4} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">1. Embudo</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {tablero.embudo.pasos.map((paso) => (
            <TarjetaPaso
              key={paso.id}
              etiqueta={paso.etiqueta}
              conteo={paso.conteo}
              conversion={paso.conversionDesdeAnterior}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-(--color-tinta-suave)">
          Cuentas creadas en el rango: {tablero.embudo.cuentasCreadas.toLocaleString('es-CL')}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">2. Por página</h2>
        <p className="mt-1 text-sm text-(--color-tinta-suave)">
          Combinaciones {'{rubro}/{comuna}'} con señal en el rango. Orden: ingresos.
        </p>
        <TablaCorte filas={tablero.porPagina} modo="pagina" />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">3. Por rubro</h2>
        <TablaCorte filas={tablero.porRubro} modo="rubro" />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">4. Dinero</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Ingresos brutos</p>
            <p className="mt-1 font-display text-2xl">
              {formatearClp(tablero.ingresos.brutoClp)}
            </p>
          </div>
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Reversas</p>
            <p className="mt-1 font-display text-2xl">
              −{formatearClp(tablero.ingresos.reversasClp)}
            </p>
          </div>
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Ingresos netos</p>
            <p className="mt-1 font-display text-2xl">
              {formatearClp(tablero.ingresos.netoClp)}
            </p>
          </div>
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Ticket promedio</p>
            <p className="mt-1 font-display text-2xl">
              {tablero.ingresos.ticketPromedioClp !== null
                ? formatearClp(tablero.ingresos.ticketPromedioClp)
                : '—'}
            </p>
            <p className="mt-1 text-xs text-(--color-tinta-suave)">
              {tablero.ingresos.comprasPagadas} compras ·{' '}
              {tablero.ingresos.comprasReversadas} reposiciones · créditos consumidos{' '}
              {formatearClp(tablero.ingresos.creditosConsumidos)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">5. Velocidad (verificado → aviso)</h2>
        <p className="mt-1 text-sm text-(--color-tinta-suave)">
          Calculado sobre {tablero.sla.n} leads con al menos un proveedor avisado
          (eventos LEAD_AVISADO). Leads sin match no entran al percentil. SLA duro:{' '}
          {SLA_AVISO_MS / 1000} s.
        </p>
        {tablero.sla.n === 0 ? (
          <p className="mt-3 text-sm text-(--color-tinta-suave)">
            Todavía no hay mediciones de aviso en este rango. Los leads verificados
            antes de instrumentar LEAD_AVISADO quedan fuera.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
              <p className="text-sm text-(--color-tinta-suave)">p50</p>
              <p className="mt-1 font-display text-2xl">{msATexto(tablero.sla.p50Ms)}</p>
            </div>
            <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
              <p className="text-sm text-(--color-tinta-suave)">p95</p>
              <p className={`mt-1 font-display text-2xl ${slaColor}`}>
                {msATexto(tablero.sla.p95Ms)}
              </p>
              <p className={`mt-1 text-sm ${slaColor}`}>
                {tablero.sla.semaforo === 'verde'
                  ? 'Dentro del SLA'
                  : tablero.sla.semaforo === 'ambar'
                    ? 'Ámbar: p95 entre 60 y 120 s'
                    : 'Rojo: p95 sobre 120 s'}
              </p>
            </div>
            <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
              <p className="text-sm text-(--color-tinta-suave)">Sobre 60 s</p>
              <p className="mt-1 font-display text-2xl">{tablero.sla.sobreSla}</p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">6. Go / no-go (Fase 0)</h2>
        <p className="mt-1 text-sm text-(--color-tinta-suave)">
          Criterio: costo por lead verificado &lt; 50 % del precio de venta de
          referencia (promedio de exclusivos activos
          {tablero.precioVentaRefClp !== null
            ? `: ${formatearClp(tablero.precioVentaRefClp)}`
            : ''}
          ).
        </p>
        <FormularioInversionAds rango={rango} inversionClp={tablero.inversionClp} />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Costo / lead verificado</p>
            <p className={`mt-1 font-display text-2xl ${goColor}`}>
              {tablero.goNoGo.costoPorLead !== null
                ? formatearClp(tablero.goNoGo.costoPorLead)
                : '—'}
            </p>
          </div>
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Umbral (50 %)</p>
            <p className="mt-1 font-display text-2xl">
              {tablero.goNoGo.umbralClp !== null
                ? formatearClp(tablero.goNoGo.umbralClp)
                : '—'}
            </p>
          </div>
          <div className="rounded-3xl border border-(--color-borde) bg-white p-4">
            <p className="text-sm text-(--color-tinta-suave)">Resultado</p>
            <p className={`mt-1 font-display text-2xl ${goColor}`}>
              {tablero.goNoGo.estado === 'verde'
                ? 'Verde'
                : tablero.goNoGo.estado === 'rojo'
                  ? 'Rojo'
                  : 'Sin datos'}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
