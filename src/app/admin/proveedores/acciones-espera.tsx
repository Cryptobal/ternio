'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  marcarListaEsperaProveedor,
  type ResultadoAccionAdmin,
} from '@/server/admin'

const ESTADO_INICIAL: ResultadoAccionAdmin = { ok: false, mensaje: '' }

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-(--color-borde) px-3 py-1.5 text-sm disabled:opacity-60"
    >
      {pending ? '…' : children}
    </button>
  )
}

export function AccionesEspera({
  proveedorId,
  estado,
}: {
  proveedorId: string
  estado: string
}) {
  const [resultado, accion] = useActionState(marcarListaEsperaProveedor, ESTADO_INICIAL)

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={accion}>
        <input type="hidden" name="proveedorId" value={proveedorId} />
        <input type="hidden" name="accion" value="visto" />
        <Boton>Marcar visto</Boton>
      </form>
      {estado !== 'APROBADO' ? (
        <form action={accion}>
          <input type="hidden" name="proveedorId" value={proveedorId} />
          <input type="hidden" name="accion" value="aprobar" />
          <Boton>Aprobar</Boton>
        </form>
      ) : null}
      {estado !== 'RECHAZADO' ? (
        <form action={accion}>
          <input type="hidden" name="proveedorId" value={proveedorId} />
          <input type="hidden" name="accion" value="rechazar" />
          <Boton>Rechazar</Boton>
        </form>
      ) : null}
      {resultado.mensaje ? (
        <p className={`w-full text-right text-xs ${resultado.ok ? '' : 'text-(--color-rojo)'}`}>
          {resultado.mensaje}
        </p>
      ) : null}
    </div>
  )
}
