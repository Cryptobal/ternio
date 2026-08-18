'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { solicitarOtroServicioAction, type EstadoFormulario } from '@/server/leads'

const ESTADO_INICIAL: EstadoFormulario = { ok: false }

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-2xl border border-(--color-marca) px-4 py-2.5 text-sm font-medium text-(--color-marca) transition hover:bg-(--color-marca) hover:text-white disabled:opacity-60"
    >
      {pending ? 'Enviando…' : 'Avísame cuando lo tengan'}
    </button>
  )
}

/**
 * "Otro servicio": siempre visible, en todas las páginas del cotizador.
 * Solo registra demanda (SolicitudRubro); nunca crea una cotización vendible.
 */
export function OtroServicio({ comunaSlug }: { comunaSlug: string }) {
  const [estado, accion] = useActionState(solicitarOtroServicioAction, ESTADO_INICIAL)

  if (estado.ok) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-(--color-borde) bg-white p-5 text-sm shadow-sm"
      >
        {estado.mensaje}
      </div>
    )
  }

  return (
    <form action={accion} className="rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold">¿Necesitas otro servicio?</h2>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        Cuéntanos cuál y te avisamos cuando tengamos empresas de ese rubro en tu zona.
      </p>

      <input type="hidden" name="comuna" value={comunaSlug} />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="textoRubro" className="sr-only">
          ¿Qué servicio necesitas?
        </label>
        <input
          id="textoRubro"
          name="textoRubro"
          placeholder="Por ejemplo: mantención de extintores"
          className="w-full rounded-2xl border border-(--color-borde) px-3 py-2.5 text-base outline-none"
        />
        <Boton />
      </div>

      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="mt-2 text-sm text-(--color-rojo)">
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
