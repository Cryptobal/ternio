'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { formatearClp } from '@/lib/dinero'
import { tomarLeadAction, type LeadPanelDisponible, type ResultadoToma } from '@/server/marketplace'

const INICIAL: ResultadoToma = { ok: false, mensaje: '' }

function Boton({
  disabled,
  children,
}: {
  disabled?: boolean
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full min-h-12 rounded-2xl bg-(--color-marca) px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
    >
      {pending ? 'Tomando…' : children}
    </button>
  )
}

export function TomarLead({
  lead,
  saldo,
}: {
  lead: LeadPanelDisponible
  saldo: number
}) {
  const [estado, accion] = useActionState(tomarLeadAction, INICIAL)

  if (lead.reservadoGard) {
    return (
      <p className="mt-4 rounded-2xl bg-(--color-ambar-suave) px-4 py-3 text-sm">
        Disponible en {lead.disponibleEnMin} min.
      </p>
    )
  }

  return (
    <div className="mt-4 grid gap-2">
      {lead.puedeExclusivo && lead.precioExclusivo ? (
        <form action={accion}>
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="tipo" value="EXCLUSIVO" />
          <Boton disabled={saldo < lead.precioExclusivo}>
            Exclusivo {formatearClp(lead.precioExclusivo)}
          </Boton>
        </form>
      ) : null}
      {lead.puedeCompartido && lead.precioCompartido ? (
        <form action={accion}>
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="tipo" value="COMPARTIDO" />
          <Boton disabled={saldo < lead.precioCompartido}>
            Compartido {formatearClp(lead.precioCompartido)}
          </Boton>
        </form>
      ) : null}
      {estado.mensaje ? (
        <p className={`text-sm ${estado.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
          {estado.mensaje}
        </p>
      ) : null}
    </div>
  )
}
