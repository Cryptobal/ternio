'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  guardarInversionAdsAction,
  type EstadoInversionAds,
} from '@/server/admin-embudo'
import type { RangoEmbudo } from '@/lib/metricas-calculo'
import { CLASE_BOTON, CLASE_CAMPO } from '@/lib/ui'

const ESTADO: EstadoInversionAds = { ok: false }

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`${CLASE_BOTON} sm:w-auto`}>
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  )
}

export function FormularioInversionAds({
  rango,
  inversionClp,
}: {
  rango: RangoEmbudo
  inversionClp: number
}) {
  const [estado, accion] = useActionState(guardarInversionAdsAction, ESTADO)

  return (
    <form action={accion} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="rango" value={rango} />
      <div className="flex-1">
        <label htmlFor="inversionClp" className="mb-1 block text-sm font-medium">
          Inversión en Ads del período (CLP)
        </label>
        <input
          id="inversionClp"
          name="inversionClp"
          inputMode="numeric"
          defaultValue={inversionClp > 0 ? String(inversionClp) : ''}
          placeholder="900000"
          className={CLASE_CAMPO}
        />
      </div>
      <Boton />
      {estado.mensaje ? (
        <p
          role="status"
          className={`text-sm ${estado.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}
        >
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
