'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import type { CampoFormulario } from '@/lib/campos'
import { crearLeadAction, type EstadoFormulario } from '@/server/leads'
import { registrarEventoCliente } from '@/components/medidor-embudo'
import { Turnstile } from '@/components/turnstile'

const ESTADO_INICIAL: EstadoFormulario = { ok: false }

const claseCampo =
  'w-full rounded-lg border border-(--color-borde) bg-white px-3 py-2.5 text-base ' +
  'outline-none focus:border-(--color-marca) focus:ring-2 focus:ring-(--color-marca)/20'

function Boton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-(--color-marca) px-5 py-3.5 text-base font-medium text-white transition hover:bg-(--color-marca-oscura) disabled:opacity-60"
    >
      {pending ? 'Enviando tu cotización…' : 'Pedir cotización gratis'}
    </button>
  )
}

function Error({ mensaje }: { mensaje: string | undefined }) {
  if (!mensaje) return null
  return <p className="mt-1 text-sm text-red-700">{mensaje}</p>
}

function CampoDinamico({
  campo,
  error,
}: {
  campo: CampoFormulario
  error: string | undefined
}) {
  const id = `campo-${campo.nombre}`

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {campo.etiqueta}
        {campo.requerido ? <span className="text-red-700"> *</span> : null}
      </label>

      {campo.tipo === 'textarea' ? (
        <textarea
          id={id}
          name={campo.nombre}
          rows={4}
          placeholder={campo.placeholder}
          className={claseCampo}
        />
      ) : campo.tipo === 'select' || campo.tipo === 'radio' ? (
        <select id={id} name={campo.nombre} className={claseCampo} defaultValue="">
          <option value="">Elige una opción</option>
          {campo.opciones?.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={campo.nombre}
          type={campo.tipo === 'numero' ? 'number' : 'text'}
          inputMode={campo.tipo === 'numero' ? 'numeric' : undefined}
          placeholder={campo.placeholder}
          className={claseCampo}
        />
      )}

      {campo.ayuda ? (
        <p className="mt-1 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p>
      ) : null}
      <Error mensaje={error} />
    </div>
  )
}

export function FormularioCotizacion({
  rubroSlug,
  comunaSlug,
  campos,
  turnstileSiteKey,
}: {
  rubroSlug: string
  comunaSlug: string
  campos: CampoFormulario[]
  turnstileSiteKey: string | undefined
}) {
  const [estado, accion] = useActionState(crearLeadAction, ESTADO_INICIAL)
  const [comenzado, setComenzado] = useState(false)
  const errores = estado.errores ?? {}
  const resumenRef = useRef<HTMLDivElement>(null)

  // FORM_START: el primer contacto real con el formulario, una sola vez.
  function marcarInicio() {
    if (comenzado) return
    setComenzado(true)
    registrarEventoCliente('FORM_START', { rubro: rubroSlug, comuna: comunaSlug })
  }

  return (
    <form action={accion} onFocusCapture={marcarInicio} className="space-y-5" noValidate>
      <input type="hidden" name="rubro" value={rubroSlug} />
      <input type="hidden" name="comuna" value={comunaSlug} />

      {/* Honeypot: invisible para personas, irresistible para bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="sitio_web">No completar</label>
        <input id="sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {estado.mensaje && !estado.ok ? (
        <div
          ref={resumenRef}
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {estado.mensaje}
        </div>
      ) : null}

      {campos.map((campo) => (
        <CampoDinamico key={campo.nombre} campo={campo} error={errores[campo.nombre]} />
      ))}

      <fieldset className="space-y-5 border-t border-(--color-borde) pt-5">
        <legend className="text-sm font-medium text-(--color-tinta-suave)">
          Tus datos de contacto
        </legend>

        <div>
          <label htmlFor="nombreContacto" className="mb-1 block text-sm font-medium">
            Tu nombre <span className="text-red-700">*</span>
          </label>
          <input
            id="nombreContacto"
            name="nombreContacto"
            autoComplete="name"
            className={claseCampo}
          />
          <Error mensaje={errores.nombreContacto} />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Correo <span className="text-red-700">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={claseCampo}
          />
          <Error mensaje={errores.email} />
        </div>

        <div>
          <label htmlFor="telefono" className="mb-1 block text-sm font-medium">
            Teléfono <span className="text-red-700">*</span>
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+56 9 1234 5678"
            className={claseCampo}
          />
          <Error mensaje={errores.telefono} />
        </div>

        <div>
          <label htmlFor="rut" className="mb-1 block text-sm font-medium">
            RUT de la empresa <span className="text-red-700">*</span>
          </label>
          <input id="rut" name="rut" placeholder="76.543.210-K" className={claseCampo} />
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Lo pedimos para que los proveedores sepan que la solicitud es real.
          </p>
          <Error mensaje={errores.rut} />
        </div>

        <div>
          <label htmlFor="razonSocial" className="mb-1 block text-sm font-medium">
            Razón social
          </label>
          <input id="razonSocial" name="razonSocial" className={claseCampo} />
          <Error mensaje={errores.razonSocial} />
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="whatsappOptIn"
            className="mt-1 size-4 rounded border-(--color-borde)"
          />
          <span>Quiero que me escriban por WhatsApp para coordinar más rápido.</span>
        </label>
      </fieldset>

      <Turnstile siteKey={turnstileSiteKey} />

      <Boton />

      <p className="text-sm text-(--color-tinta-suave)">
        Cotizar es gratis. Tus datos de contacto no se muestran a nadie hasta que una empresa
        toma tu solicitud. Revisa cómo los tratamos en la{' '}
        <Link href="/privacidad" className="underline underline-offset-4">
          política de privacidad
        </Link>
        .
      </p>
    </form>
  )
}
