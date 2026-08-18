import { Prisma } from '@prisma/client'

import { AccionesEspera } from '@/app/admin/proveedores/acciones-espera'
import { prisma } from '@/lib/prisma'
import { formatearRut } from '@/lib/rut'
import { formatearTelefono } from '@/lib/telefono'
import { requerirAdmin } from '@/server/sesion'
import type { SolicitudEsperaProveedor } from '@/lib/lista-espera'

export const dynamic = 'force-dynamic'

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function leerSolicitud(valor: unknown): SolicitudEsperaProveedor | null {
  if (!valor || typeof valor !== 'object') return null
  const objeto = valor as Partial<SolicitudEsperaProveedor>
  if (!Array.isArray(objeto.rubros) || !Array.isArray(objeto.comunas)) return null
  return {
    rubros: objeto.rubros.filter((item): item is string => typeof item === 'string'),
    region: typeof objeto.region === 'string' ? objeto.region : '',
    provincia: typeof objeto.provincia === 'string' ? objeto.provincia : '',
    comunas: objeto.comunas.filter((item): item is string => typeof item === 'string'),
  }
}

export default async function AdminProveedores() {
  await requerirAdmin()

  const filas = await prisma.proveedor.findMany({
    where: { solicitudEspera: { not: Prisma.DbNull } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      nombre: true,
      rutNormalizado: true,
      email: true,
      telefonoE164: true,
      estado: true,
      vistoAt: true,
      createdAt: true,
      solicitudEspera: true,
    },
  })

  return (
    <>
      <h1 className="text-2xl font-semibold">Proveedores / lista de espera</h1>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        Inscripciones de /proveedores. Aprobar no abre créditos ni matching: solo deja
        constancia de que Carlos las revisó.
      </p>

      {filas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
          Nadie se ha anotado todavía.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-(--color-borde) bg-white">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-(--color-borde) text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Interés</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Visto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const espera = leerSolicitud(fila.solicitudEspera)
                return (
                  <tr key={fila.id} className="border-b border-(--color-borde) last:border-0 align-top">
                    <td className="px-4 py-3">{formatoFechaHora.format(fila.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{fila.nombre}</p>
                      <p className="text-(--color-tinta-suave)">
                        {fila.rutNormalizado ? formatearRut(fila.rutNormalizado) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{fila.email ?? '—'}</p>
                      <p className="text-(--color-tinta-suave)">
                        {fila.telefonoE164 ? formatearTelefono(fila.telefonoE164) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{espera?.rubros.join(', ') || '—'}</p>
                      <p className="text-(--color-tinta-suave)">
                        {espera
                          ? `${espera.provincia || '—'}, ${espera.region || '—'} · ${espera.comunas.join(', ')}`
                          : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">{fila.estado}</td>
                    <td className="px-4 py-3">
                      {fila.vistoAt ? formatoFechaHora.format(fila.vistoAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AccionesEspera proveedorId={fila.id} estado={fila.estado} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
