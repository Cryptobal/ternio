import type { Metadata } from 'next'
import Link from 'next/link'

import { etiquetaModoCobertura, leerSnapshotCobertura, textoCobertura } from '@/lib/cobertura'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { formatearTelefono } from '@/lib/telefono'
import { salir } from '@/server/auth-acciones'
import { requerirProveedor } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Tu cuenta de proveedor',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function textoEstado(estado: string): string {
  switch (estado) {
    case 'APROBADO':
      return 'Cuenta revisada'
    case 'RECHAZADO':
      return 'No pudimos continuar con esta cuenta'
    case 'SUSPENDIDO':
      return 'Cuenta suspendida'
    default:
      return 'Cuenta creada. Pendiente de revisión'
  }
}

export default async function PanelProveedor() {
  const sesion = await requerirProveedor()

  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId: sesion.user.id },
    select: {
      nombre: true,
      rutNormalizado: true,
      email: true,
      telefonoE164: true,
      estado: true,
      coberturaNacional: true,
      solicitudEspera: true,
      coberturas: { select: { id: true } },
    },
  })

  const snapshot = leerSnapshotCobertura(proveedor?.solicitudEspera)
  const cobertura = proveedor?.coberturaNacional
    ? 'Todo Chile'
    : snapshot
      ? textoCobertura(snapshot)
      : proveedor && proveedor.coberturas.length > 0
        ? `${proveedor.coberturas.length} comunas`
        : 'Sin cobertura'

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">Tu cuenta</h1>
        <form action={salir}>
          <button type="submit" className="text-sm text-(--color-tinta-suave) underline underline-offset-4">
            Cerrar sesión
          </button>
        </form>
      </div>

      {!proveedor ? (
        <div className="mt-8 rounded-2xl border border-(--color-borde) bg-white p-6 shadow-sm">
          <p className="font-medium">No encontramos una empresa ligada a esta cuenta.</p>
          <Link
            href="/proveedores"
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-(--color-marca) px-5 py-3 text-white"
          >
            Completar datos
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4 rounded-2xl border border-(--color-borde) bg-white p-6 shadow-sm">
          <p className="inline-block rounded-full bg-(--color-papel) px-3 py-1 text-sm">
            {textoEstado(proveedor.estado)}
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-(--color-tinta-suave)">Empresa</dt>
              <dd className="font-medium">{proveedor.nombre}</dd>
            </div>
            <div>
              <dt className="text-(--color-tinta-suave)">RUT</dt>
              <dd>{proveedor.rutNormalizado ? formatearRut(proveedor.rutNormalizado) : '—'}</dd>
            </div>
            <div>
              <dt className="text-(--color-tinta-suave)">Celular</dt>
              <dd>{proveedor.telefonoE164 ? formatearTelefono(proveedor.telefonoE164) : '—'}</dd>
            </div>
            <div>
              <dt className="text-(--color-tinta-suave)">Correo</dt>
              <dd>{proveedor.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-(--color-tinta-suave)">Rubros</dt>
              <dd>{snapshot?.rubros.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-(--color-tinta-suave)">
                Cobertura{snapshot ? ` · ${etiquetaModoCobertura(snapshot.modo)}` : ''}
              </dt>
              <dd>{cobertura}</dd>
            </div>
          </dl>
          <p className="text-sm text-(--color-tinta-suave)">
            Aún no hay marketplace ni compra de leads. Te avisamos cuando se abra.
          </p>
        </div>
      )}
    </div>
  )
}
