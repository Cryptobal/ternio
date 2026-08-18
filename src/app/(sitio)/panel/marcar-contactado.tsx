'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { marcarContactadoAction, type ResultadoToma } from '@/server/marketplace'

const INICIAL: ResultadoToma = { ok: false, mensaje: '' }

function Boton({ contactado }: { contactado: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 min-h-11 w-full rounded-2xl border border-(--color-borde) bg-white px-4 py-2 text-sm font-medium transition hover:border-(--color-marca) disabled:opacity-60"
    >
      {pending ? 'Guardando…' : contactado ? '✓ Contactado' : 'Marcar como contactado'}
    </button>
  )
}

export function MarcarContactado({
  compraId,
  contactadoEn,
}: {
  compraId: string
  contactadoEn: Date | null
}) {
  const [estado, accion] = useActionState(marcarContactadoAction, INICIAL)
  const contactado = Boolean(contactadoEn)

  return (
    <form action={accion}>
      <input type="hidden" name="compraId" value={compraId} />
      <Boton contactado={contactado} />
      {estado.mensaje ? (
        <p className={`mt-2 text-xs ${estado.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
