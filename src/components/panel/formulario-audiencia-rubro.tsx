'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  actualizarAudienciasCoberturaAction,
  type ResultadoAudienciasPanel,
} from '@/server/panel-audiencias'
import { CLASE_CHIP } from '@/lib/ui'

const INICIAL: ResultadoAudienciasPanel = { ok: false, mensaje: '' }

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 text-sm font-medium underline underline-offset-4 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  )
}

export function FormularioAudienciaRubro({
  rubroSlug,
  nombre,
  iniciales,
}: {
  rubroSlug: string
  nombre: string
  iniciales: string[]
}) {
  const [estado, accion] = useActionState(actualizarAudienciasCoberturaAction, INICIAL)
  const hogar = iniciales.includes('hogar')
  const empresa = iniciales.includes('empresa')

  return (
    <form action={accion} className="rounded-2xl border border-(--color-borde) p-3">
      <input type="hidden" name="rubroSlug" value={rubroSlug} />
      <p className="text-sm font-medium">{nombre}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className={`${CLASE_CHIP} inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm`}>
          <input type="checkbox" name="audiencias" value="empresa" defaultChecked={empresa} />
          Empresa
        </label>
        <label className={`${CLASE_CHIP} inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm`}>
          <input type="checkbox" name="audiencias" value="hogar" defaultChecked={hogar} />
          Casa
        </label>
      </div>
      <div className="mt-2">
        <Boton />
      </div>
      {estado.mensaje ? (
        <p className={`mt-1 text-sm ${estado.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
