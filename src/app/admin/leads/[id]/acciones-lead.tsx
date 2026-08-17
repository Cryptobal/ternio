'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  marcarTelefonoVerificado,
  moverEstadoLead,
  type ResultadoAccionAdmin,
} from '@/server/admin'

const ESTADO_INICIAL: ResultadoAccionAdmin = { ok: false, mensaje: '' }

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-(--color-marca) px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Guardando…' : children}
    </button>
  )
}

function Aviso({ estado }: { estado: ResultadoAccionAdmin }) {
  if (!estado.mensaje) return null
  return (
    <p
      role="status"
      className={`mt-2 text-sm ${estado.ok ? 'text-(--color-marca-oscura)' : 'text-red-700'}`}
    >
      {estado.mensaje}
    </p>
  )
}

export function AccionesLead({
  leadId,
  telefonoVerificado,
}: {
  leadId: string
  telefonoVerificado: boolean
}) {
  const [estadoMover, accionMover] = useActionState(moverEstadoLead, ESTADO_INICIAL)
  const [estadoTelefono, accionTelefono] = useActionState(
    marcarTelefonoVerificado,
    ESTADO_INICIAL,
  )

  return (
    <div className="space-y-6">
      {!telefonoVerificado ? (
        <form action={accionTelefono} className="rounded-xl border border-(--color-borde) bg-white p-5">
          <h3 className="font-medium">Verificación del teléfono</h3>
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            En Fase 0 la confirmas llamando. Queda registrada en el historial como
            verificación manual del admin, distinta de la que hará el OTP.
          </p>
          <input type="hidden" name="leadId" value={leadId} />
          <div className="mt-3">
            <Boton>Confirmé el teléfono por llamada</Boton>
          </div>
          <Aviso estado={estadoTelefono} />
        </form>
      ) : null}

      <form action={accionMover} className="rounded-xl border border-(--color-borde) bg-white p-5">
        <h3 className="font-medium">Cambiar estado</h3>
        <input type="hidden" name="leadId" value={leadId} />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="destino" className="mb-1 block text-sm font-medium">
              Nuevo estado
            </label>
            <select
              id="destino"
              name="destino"
              defaultValue="EN_REVISION"
              className="w-full rounded-lg border border-(--color-borde) px-3 py-2.5"
            >
              <option value="EN_REVISION">En revisión</option>
              <option value="VERIFICADO">Verificado</option>
              <option value="DESCARTADO">Descartado</option>
              <option value="ARCHIVADO">Archivado</option>
            </select>
          </div>

          <div>
            <label htmlFor="nota" className="mb-1 block text-sm font-medium">
              Nota (opcional)
            </label>
            <input
              id="nota"
              name="nota"
              className="w-full rounded-lg border border-(--color-borde) px-3 py-2.5"
            />
          </div>
        </div>

        <div className="mt-3">
          <Boton>Guardar cambio</Boton>
        </div>
        <Aviso estado={estadoMover} />
      </form>
    </div>
  )
}
