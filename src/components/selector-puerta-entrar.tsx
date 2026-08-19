'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

import { FormularioOtpEntrar } from '@/components/formulario-otp'
import { entrarComoProveedor, type EstadoLoginProveedor } from '@/server/auth-acciones'
import {
  CLASE_BOTON,
  CLASE_BOTON_SUAVE,
  CLASE_CAMPO,
  CLASE_CHIP,
  CLASE_SUPERFICIE,
} from '@/lib/ui'

type Puerta = 'elegir' | 'comprador' | 'proveedor'
type ModoForm = 'password' | 'otp'

const ESTADO_LOGIN: EstadoLoginProveedor = {}

function BotonLogin({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={CLASE_BOTON}>
      {pending ? 'Un segundo…' : children}
    </button>
  )
}

function FormularioPasswordProveedor({ onOtp }: { onOtp: () => void }) {
  const [estado, accion] = useActionState(entrarComoProveedor, ESTADO_LOGIN)

  return (
    <div className="space-y-3">
      <p className="text-sm text-(--color-texto-suave)">
        Entra con el correo de tu cuenta. Si no tienes contraseña, pídete un código al celular.
      </p>
      <form action={accion} className="space-y-3">
        <div>
          <label htmlFor="email-proveedor-login" className="mb-1 block text-sm font-medium">
            Correo
          </label>
          <input
            id="email-proveedor-login"
            name="email"
            type="email"
            autoComplete="email"
            className={CLASE_CAMPO}
            required
          />
        </div>
        <div>
          <label htmlFor="password-proveedor-login" className="mb-1 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password-proveedor-login"
            name="password"
            type="password"
            autoComplete="current-password"
            className={CLASE_CAMPO}
            required
          />
        </div>
        {estado.error ? (
          <p role="alert" className="text-sm text-(--color-rojo)">
            {estado.error}
          </p>
        ) : null}
        <BotonLogin>Entrar a mi panel</BotonLogin>
      </form>
      <div className="relative py-2 text-center text-xs text-(--color-texto-suave)">
        <span className="bg-(--color-superficie) relative z-10 px-2">o sin contraseña</span>
        <span className="absolute inset-x-0 top-1/2 border-t border-(--color-linea)" aria-hidden="true" />
      </div>
      <button type="button" onClick={onOtp} className={CLASE_BOTON_SUAVE}>
        Enviarme un código al celular
      </button>
    </div>
  )
}

/**
 * El comprador aún no tiene login por contraseña (solo OTP).
 * Mostramos la misma estructura; el intento devuelve un error explícito.
 */
function FormularioPasswordComprador({ onOtp }: { onOtp: () => void }) {
  const [error, setError] = useState<string | null>(null)

  function intentar(event: React.FormEvent) {
    event.preventDefault()
    setError(
      'Esta cuenta no tiene contraseña. Usa el código al celular para entrar a tus cotizaciones.',
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-(--color-texto-suave)">
        Si cotizaste con tu celular, lo más rápido es pedirte un código. La contraseña queda
        para cuando la tengas configurada.
      </p>
      <form onSubmit={intentar} className="space-y-3">
        <div>
          <label htmlFor="email-comprador-login" className="mb-1 block text-sm font-medium">
            Correo
          </label>
          <input
            id="email-comprador-login"
            name="email"
            type="email"
            autoComplete="email"
            className={CLASE_CAMPO}
            required
          />
        </div>
        <div>
          <label htmlFor="password-comprador-login" className="mb-1 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password-comprador-login"
            name="password"
            type="password"
            autoComplete="current-password"
            className={CLASE_CAMPO}
            required
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-(--color-rojo)">
            {error}{' '}
            <button type="button" onClick={onOtp} className="font-medium underline underline-offset-2">
              Enviarme el código
            </button>
          </p>
        ) : null}
        <button type="submit" className={CLASE_BOTON}>
          Entrar a mis cotizaciones
        </button>
      </form>
      <div className="relative py-2 text-center text-xs text-(--color-texto-suave)">
        <span className="bg-(--color-superficie) relative z-10 px-2">o sin contraseña</span>
        <span className="absolute inset-x-0 top-1/2 border-t border-(--color-linea)" aria-hidden="true" />
      </div>
      <button type="button" onClick={onOtp} className={CLASE_BOTON_SUAVE}>
        Enviarme un código al celular
      </button>
    </div>
  )
}

function PiePuerta({
  pregunta,
  href,
  etiqueta,
}: {
  pregunta: string
  href: string
  etiqueta: string
}) {
  return (
    <p className="mt-4 text-sm text-(--color-texto-suave)">
      {pregunta}{' '}
      <Link href={href} className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
        {etiqueta}
      </Link>
    </p>
  )
}

export function SelectorPuertaEntrar() {
  const [puerta, setPuerta] = useState<Puerta>('elegir')
  const [modo, setModo] = useState<ModoForm>('password')

  if (puerta === 'comprador') {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setPuerta('elegir')
            setModo('password')
          }}
          className="text-sm text-(--color-marca) underline-offset-4 hover:underline"
        >
          ← Volver
        </button>
        <h2 className="mt-4 font-display text-xl">Pedí una cotización</h2>
        <div className="mt-4">
          {modo === 'password' ? (
            <div className={CLASE_SUPERFICIE}>
              <FormularioPasswordComprador onOtp={() => setModo('otp')} />
            </div>
          ) : (
            <FormularioOtpEntrar />
          )}
        </div>
        <PiePuerta
          pregunta="¿Nunca has cotizado?"
          href="/#cotizador"
          etiqueta="Pide tu primera cotización"
        />
      </div>
    )
  }

  if (puerta === 'proveedor') {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setPuerta('elegir')
            setModo('password')
          }}
          className="text-sm text-(--color-marca) underline-offset-4 hover:underline"
        >
          ← Volver
        </button>
        <h2 className="mt-4 font-display text-xl">Vendo servicios</h2>
        <div className="mt-4">
          {modo === 'password' ? (
            <div className={CLASE_SUPERFICIE}>
              <FormularioPasswordProveedor onOtp={() => setModo('otp')} />
            </div>
          ) : (
            <FormularioOtpEntrar />
          )}
        </div>
        <PiePuerta
          pregunta="¿Todavía no tienes cuenta?"
          href="/proveedores#crear-cuenta"
          etiqueta="Créala en un minuto"
        />
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-xl">¿Cómo entras?</h2>
      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={() => setPuerta('comprador')}
          className={`${CLASE_CHIP} min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ambar)`}
        >
          <span className="font-medium">Pedí una cotización</span>
          <span className="mt-1 block text-sm text-(--color-texto-suave)">
            Ver el estado de lo que pedí
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPuerta('proveedor')}
          className={`${CLASE_CHIP} min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ambar)`}
        >
          <span className="font-medium">Vendo servicios</span>
          <span className="mt-1 block text-sm text-(--color-texto-suave)">
            Entrar a mi panel de proveedor
          </span>
        </button>
      </div>
    </div>
  )
}
