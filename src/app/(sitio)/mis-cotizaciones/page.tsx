import type { Metadata } from 'next'
import Link from 'next/link'
import { EstadoCompraLead } from '@prisma/client'

import { parsearCampos } from '@/lib/campos'
import {
  recapDatosComprador,
  resumenCotizacionComprador,
  textoEmpresasTomaron,
} from '@/lib/estado-comprador'
import { prisma } from '@/lib/prisma'
import { textoEstadoComprador } from '@/lib/rubros'
import { salir } from '@/server/auth-acciones'
import { capacidadesDe } from '@/server/capacidades'
import { reclamarLeadsAction } from '@/server/leads'
import { sesionActual } from '@/server/sesion'

/** Tus cotizaciones: fuera del índice y fuera del sitemap. No es un panel. */
export const metadata: Metadata = {
  title: 'Tus cotizaciones',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const formatoFecha = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default async function MisCotizaciones() {
  const sesion = await sesionActual()

  if (!sesion?.user?.id) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
        <h1 className="font-display text-2xl">Tus cotizaciones</h1>
        <p className="mt-3 text-(--color-tinta-suave)">
          Entra con el teléfono que usaste al cotizar. Te enviamos un código de un solo uso.
        </p>
        <Link
          href="/entrar"
          className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-(--color-marca) px-5 py-3 font-medium text-white"
        >
          Entrar con mi teléfono
        </Link>
      </div>
    )
  }

  await reclamarLeadsAction()

  const [caps, cotizaciones] = await Promise.all([
    capacidadesDe(sesion.user.id),
    prisma.lead.findMany({
      where: { compradorUsuarioId: sesion.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        rutValido: true,
        telefonoVerificado: true,
        datos: true,
        rubro: { select: { nombre: true, slug: true, camposFormulario: true } },
        comuna: { select: { nombre: true, slug: true } },
        _count: {
          select: {
            compras: { where: { estado: EstadoCompraLead.PAGADA } },
          },
        },
      },
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">Tus cotizaciones</h1>
        <div className="flex flex-wrap items-center gap-4">
          {caps.tienePerfilProveedor ? (
            <Link href="/panel" className="text-sm underline underline-offset-4">
              Ir a mi panel de proveedor
            </Link>
          ) : null}
          <form action={salir}>
            <button
              type="submit"
              className="text-sm text-(--color-tinta-suave) underline underline-offset-4"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {cotizaciones.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-(--color-borde) bg-white p-6 shadow-sm">
          <p className="font-medium">Todavía no tienes cotizaciones acá.</p>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Si enviaste una desde otro navegador, entra con el mismo teléfono para retomarla.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-(--color-marca) px-5 py-3 text-white"
          >
            Pedir una cotización
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {cotizaciones.map((cotizacion) => {
            const resumen = resumenCotizacionComprador(cotizacion)
            const recap = recapDatosComprador(
              cotizacion.datos,
              parsearCampos(cotizacion.rubro.camposFormulario),
            )
            return (
              <li
                key={cotizacion.id}
                className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-medium">
                    {cotizacion.rubro.nombre} en {cotizacion.comuna.nombre}
                  </h2>
                  <span className="font-mono text-sm text-(--color-tinta-suave)">
                    {formatoFecha.format(cotizacion.createdAt)}
                  </span>
                </div>
                <p className="mt-2 inline-block rounded-full bg-(--color-papel) px-3 py-1 text-sm">
                  {resumen.estado || textoEstadoComprador(cotizacion.estado)}
                </p>
                <p className="mt-3 text-sm">{textoEmpresasTomaron(cotizacion._count.compras)}</p>
                {resumen.siguiente ? (
                  <p className="mt-2 text-sm text-(--color-tinta-suave)">{resumen.siguiente}</p>
                ) : null}
                {recap.length > 0 ? (
                  <dl className="mt-4 grid gap-2 text-sm">
                    {recap.map((linea) => (
                      <div key={linea.etiqueta}>
                        <dt className="text-(--color-tinta-suave)">{linea.etiqueta}</dt>
                        <dd>{linea.valor}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
