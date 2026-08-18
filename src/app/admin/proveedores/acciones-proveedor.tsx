'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  ajustarCreditosEmergencia,
  marcarListaEsperaProveedor,
  type ResultadoAccionAdmin,
} from '@/server/admin'

const INICIAL: ResultadoAccionAdmin = { ok: false, mensaje: '' }

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-2xl border border-(--color-borde) px-4 py-2 text-sm disabled:opacity-60"
    >
      {pending ? '…' : children}
    </button>
  )
}

export function AccionesProveedor({
  proveedorId,
  estado,
}: {
  proveedorId: string
  estado: string
}) {
  const [resultado, accion] = useActionState(marcarListaEsperaProveedor, INICIAL)
  const [ajuste, accionAjuste] = useActionState(ajustarCreditosEmergencia, INICIAL)

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {estado !== 'APROBADO' ? (
          <form action={accion}>
            <input type="hidden" name="proveedorId" value={proveedorId} />
            <input type="hidden" name="accion" value="aprobar" />
            <Boton>Aprobar</Boton>
          </form>
        ) : null}
        {estado !== 'SUSPENDIDO' ? (
          <form action={accion}>
            <input type="hidden" name="proveedorId" value={proveedorId} />
            <input type="hidden" name="accion" value="suspender" />
            <Boton>Suspender</Boton>
          </form>
        ) : null}
        {estado !== 'RECHAZADO' ? (
          <form action={accion}>
            <input type="hidden" name="proveedorId" value={proveedorId} />
            <input type="hidden" name="accion" value="rechazar" />
            <Boton>Rechazar</Boton>
          </form>
        ) : null}
      </div>
      {resultado.mensaje ? (
        <p className={`text-sm ${resultado.ok ? '' : 'text-(--color-rojo)'}`}>{resultado.mensaje}</p>
      ) : null}

      <details className="text-sm text-(--color-tinta-suave)">
        <summary className="cursor-pointer">Ajuste de emergencia</summary>
        <form action={accionAjuste} className="mt-2 grid gap-2">
          <input type="hidden" name="proveedorId" value={proveedorId} />
          <input
            name="montoClp"
            type="number"
            placeholder="Monto CLP (+ o −)"
            className="min-h-11 rounded-2xl border border-(--color-borde) px-3"
          />
          <input
            name="descripcion"
            placeholder="Por qué"
            className="min-h-11 rounded-2xl border border-(--color-borde) px-3"
          />
          <Boton>Registrar ajuste</Boton>
        </form>
        {ajuste.mensaje ? <p className="mt-1">{ajuste.mensaje}</p> : null}
      </details>
    </div>
  )
}
