'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { reversarCompraLead, type ResultadoAccionAdmin } from '@/server/admin'

const INICIAL: ResultadoAccionAdmin = { ok: false, mensaje: '' }

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="text-sm underline underline-offset-4">
      {pending ? '…' : 'Reversa (datos falsos)'}
    </button>
  )
}

export function ReversaCompra({ compraId }: { compraId: string }) {
  const [estado, accion] = useActionState(reversarCompraLead, INICIAL)
  return (
    <form action={accion} className="mt-2">
      <input type="hidden" name="compraId" value={compraId} />
      <Boton />
      {estado.mensaje ? <p className="text-sm">{estado.mensaje}</p> : null}
    </form>
  )
}
