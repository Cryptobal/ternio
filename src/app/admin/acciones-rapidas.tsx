'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { moverEstadoLead, type ResultadoAccionAdmin } from '@/server/admin'

const INICIAL: ResultadoAccionAdmin = { ok: false, mensaje: '' }

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-2xl bg-(--color-marca) px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? '…' : children}
    </button>
  )
}

export function AccionesRapidasLead({
  leadId,
  estado,
  rutValido,
  telefonoVerificado,
}: {
  leadId: string
  estado: string
  rutValido: boolean
  telefonoVerificado: boolean
}) {
  const [resultado, accion] = useActionState(moverEstadoLead, INICIAL)
  const puedeVerificar =
    (estado === 'RECIBIDO' || estado === 'EN_REVISION') && rutValido && telefonoVerificado
  const puedeDescartar = estado !== 'DESCARTADO' && estado !== 'ARCHIVADO'

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {puedeVerificar ? (
        <form action={accion}>
          <input type="hidden" name="leadId" value={leadId} />
          <input type="hidden" name="destino" value="VERIFICADO" />
          <Boton>Verificado</Boton>
        </form>
      ) : null}
      {puedeDescartar ? (
        <form action={accion}>
          <input type="hidden" name="leadId" value={leadId} />
          <input type="hidden" name="destino" value="DESCARTADO" />
          <Boton>Descartar</Boton>
        </form>
      ) : null}
      {resultado.mensaje ? (
        <p className={`w-full text-sm ${resultado.ok ? '' : 'text-(--color-rojo)'}`}>
          {resultado.mensaje}
        </p>
      ) : null}
    </div>
  )
}
