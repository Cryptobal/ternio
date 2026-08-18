'use client'

import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { SelectorTerritorio } from '@/components/selector-territorio'
import { comunaPorSlug, type ComunaTerritorio } from '@/lib/territorio'
import { inscribirListaEsperaAction } from '@/server/proveedores'
import type { EstadoFormulario } from '@/server/leads'

const ESTADO_INICIAL: EstadoFormulario = { ok: false }

const claseCampo =
  'w-full min-h-11 rounded-2xl border border-(--color-borde) bg-white px-3 py-2.5 text-base outline-none'

function BotonEnviar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-11 rounded-2xl bg-(--color-marca) px-5 py-3.5 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Enviando…' : 'Quiero que me avisen'}
    </button>
  )
}

export function FormularioListaEspera({
  rubros,
  comunas,
}: {
  rubros: { slug: string; nombre: string }[]
  comunas: ComunaTerritorio[]
}) {
  const [estado, accion] = useActionState(inscribirListaEsperaAction, ESTADO_INICIAL)
  const [comunasElegidas, setComunasElegidas] = useState<string[]>([])
  const errores = estado.errores ?? {}

  const ancla = useMemo(() => {
    const primera = comunasElegidas[0]
    return primera ? comunaPorSlug(comunas, primera) : undefined
  }, [comunas, comunasElegidas])

  if (estado.ok) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-(--color-borde) bg-white p-6 shadow-sm"
      >
        <h2 className="font-display text-2xl">Listo, quedó anotado</h2>
        <p className="mt-2 text-(--color-tinta-suave)">
          {estado.mensaje ?? 'Te avisamos cuando se abra el onboarding.'}
        </p>
      </div>
    )
  }

  return (
    <form action={accion} className="space-y-4 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl">Súmate a la lista de espera</h2>
      <p className="text-sm text-(--color-tinta-suave)">
        Todavía no hay onboarding ni venta de leads. Te avisamos cuando se abra.
      </p>

      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="rounded-2xl bg-(--color-rojo-suave) px-4 py-3 text-sm text-(--color-rojo)">
          {estado.mensaje}
        </p>
      ) : null}

      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="sitio_web_proveedor">No completar</label>
        <input id="sitio_web_proveedor" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="nombreEmpresa" className="mb-1 block text-sm font-medium">
          Nombre de la empresa
        </label>
        <input id="nombreEmpresa" name="nombreEmpresa" className={claseCampo} required />
        {errores.nombreEmpresa ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.nombreEmpresa}</p> : null}
      </div>

      <div>
        <label htmlFor="rut-espera" className="mb-1 block text-sm font-medium">
          RUT
        </label>
        <input id="rut-espera" name="rut" className={claseCampo} placeholder="76.482.113-5" required />
        {errores.rut ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.rut}</p> : null}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Rubros de interés</legend>
        <ul className="grid gap-2">
          {rubros.map((rubro) => (
            <li key={rubro.slug}>
              <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-(--color-borde) px-3 py-2">
                <input type="checkbox" name="rubros" value={rubro.slug} />
                <span>{rubro.nombre}</span>
              </label>
            </li>
          ))}
        </ul>
        {errores.rubros ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.rubros}</p> : null}
      </fieldset>

      <div>
        <p className="mb-2 text-sm font-medium">Cobertura</p>
        <SelectorTerritorio
          comunas={comunas}
          multiple
          values={comunasElegidas}
          onChangeMultiple={setComunasElegidas}
          idPrefijo="espera"
        />
        {comunasElegidas.map((slug) => (
          <input key={slug} type="hidden" name="comunas" value={slug} />
        ))}
        <input type="hidden" name="region" value={ancla?.region ?? ''} />
        <input type="hidden" name="provincia" value={ancla?.provincia ?? ''} />
        {errores.comunas || errores.region || errores.provincia ? (
          <p className="mt-1 text-sm text-(--color-rojo)">
            {errores.comunas ?? errores.region ?? errores.provincia}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="telefono-espera" className="mb-1 block text-sm font-medium">
          Celular
        </label>
        <input
          id="telefono-espera"
          name="telefono"
          type="tel"
          inputMode="tel"
          className={claseCampo}
          placeholder="+56 9 8123 4567"
          required
        />
        {errores.telefono ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.telefono}</p> : null}
      </div>

      <div>
        <label htmlFor="email-espera" className="mb-1 block text-sm font-medium">
          Correo
        </label>
        <input id="email-espera" name="email" type="email" className={claseCampo} required />
        {errores.email ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.email}</p> : null}
      </div>

      <BotonEnviar />
    </form>
  )
}
