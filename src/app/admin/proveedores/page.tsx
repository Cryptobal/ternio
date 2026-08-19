import { Prisma } from '@prisma/client'

import { AccionesProveedor } from '@/app/admin/proveedores/acciones-proveedor'
import { etiquetaModoCobertura, leerSnapshotCobertura, textoCobertura } from '@/lib/cobertura'
import { formatearClp } from '@/lib/dinero'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { saldoDesdeMovimientos } from '@/lib/creditos'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

export default async function AdminProveedores() {
  await requerirAdmin()

  const filas = await prisma.proveedor.findMany({
    where: {
      OR: [{ solicitudEspera: { not: Prisma.DbNull } }, { usuarioId: { not: null } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      nombre: true,
      rutNormalizado: true,
      estado: true,
      coberturaNacional: true,
      solicitudEspera: true,
      origenAlta: true,
      usuario: { select: { telefonoE164Verificado: true } },
      movimientos: { select: { montoCreditos: true } },
      _count: { select: { coberturas: true } },
    },
  })

  return (
    <>
      <h1 className="text-2xl font-semibold">Proveedores</h1>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        El saldo lo carga el sistema al confirmar el celular. Acá se suspende o se
        corrige una emergencia.
      </p>

      {filas.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-(--color-borde) bg-white p-5">
          Nadie ha creado una cuenta todavía.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {filas.map((fila) => {
            const snapshot = leerSnapshotCobertura(fila.solicitudEspera)
            const cobertura = fila.coberturaNacional
              ? 'Todo Chile'
              : snapshot
                ? `${etiquetaModoCobertura(snapshot.modo)} · ${textoCobertura(snapshot)}`
                : fila._count.coberturas > 0
                  ? `${fila._count.coberturas} comunas`
                  : '—'
            const saldo = saldoDesdeMovimientos(fila.movimientos.map((m) => m.montoCreditos))
            return (
              <li key={fila.id} className="rounded-2xl border border-(--color-borde) bg-white p-5">
                <p className="font-medium">{fila.nombre}</p>
                <p className="text-sm text-(--color-tinta-suave)">
                  {fila.rutNormalizado ? formatearRut(fila.rutNormalizado) : 'Sin RUT'} ·{' '}
                  {fila.usuario?.telefonoE164Verificado ? 'Celular ok' : 'Celular pendiente'}
                </p>
                <p className="mt-1 text-sm">
                  {fila.estado} · {formatearClp(saldo)} · {cobertura}
                </p>
                <p className="text-sm text-(--color-tinta-suave)">
                  {snapshot?.rubros.join(', ') || 'Sin rubros'}
                  {' · '}
                  Origen: {fila.origenAlta ?? 'directo'}
                </p>
                <AccionesProveedor proveedorId={fila.id} estado={fila.estado} />
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
