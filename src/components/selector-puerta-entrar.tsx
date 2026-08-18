'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

import { FormularioOtpEntrar } from '@/components/formulario-otp'
import { entrarComoProveedor, type EstadoLoginProveedor } from '@/server/auth-acciones'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_SUPERFICIE } from '@/lib/ui'

type Puerta = 'elegir' | 'comprador' | 'proveedor'
type PestanaProveedor = 'password' | 'otp'

const ESTADO_LOGIN: EstadoLoginProveedor = {}

function BotonLogin({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={CLASE_BOTON}>
      {pending ? 'Un segundo…' : children}
    </button>
  )
}

function FormularioPasswordProveedor() {
  const [estado, accion] = useActionState(entrarComoProveedor, ESTADO_LOGIN)

  return (
    <form action={accion} className="mt-4 space-y-3">
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
      <BotonLogin>Entrar</BotonLogin>
      <p className="text-sm text-(--color-tinta-suave)">
        ¿Olvidaste la contraseña? En V1 entra con el código al celular.
      </p>
    </form>
  )
}

export function SelectorPuertaEntrar() {
  const [puerta, setPuerta] = useState<Puerta>('elegir')
  const [pestana, setPestana] = useState<PestanaProveedor>('password')

  if (puerta === 'comprador') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setPuerta('elegir')}
          className="text-sm text-(--color-marca) underline-offset-4 hover:underline"
        >
          ← Volver
        </button>
        <h2 className="mt-4 font-display text-xl">Pedí una cotización</h2>
        <p className="mt-2 text-sm text-(--color-tinta-suave)">
          Entra con el celular que usaste al cotizar. Te enviamos un código.
        </p>
        <FormularioOtpEntrar />
      </div>
    )
  }

  if (puerta === 'proveedor') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setPuerta('elegir')}
          className="text-sm text-(--color-marca) underline-offset-4 hover:underline"
        >
          ← Volver
        </button>
        <h2 className="mt-4 font-display text-xl">Vendo servicios</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setPestana('password')}
            className={`${CLASE_CHIP} ${pestana === 'password' ? CLASE_CHIP_ACTIVO : ''}`}
          >
            Correo y contraseña
          </button>
          <button
            type="button"
            onClick={() => setPestana('otp')}
            className={`${CLASE_CHIP} ${pestana === 'otp' ? CLASE_CHIP_ACTIVO : ''}`}
          >
            Código al celular
          </button>
        </div>
        <div className={`${CLASE_SUPERFICIE} mt-4`}>
          {pestana === 'password' ? <FormularioPasswordProveedor /> : <FormularioOtpEntrar />}
        </div>
        <p className="mt-4 text-sm text-(--color-tinta-suave)">
          ¿Todavía no tienes cuenta?{' '}
          <Link
            href="/proveedores#crear-cuenta"
            className="font-medium text-(--color-marca) underline-offset-4 hover:underline"
          >
            Créala en un minuto
          </Link>
        </p>
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
          <span className="mt-1 block text-sm text-(--color-tinta-suave)">
            Ver el estado de lo que pedí
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPuerta('proveedor')}
          className={`${CLASE_CHIP} min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ambar)`}
        >
          <span className="font-medium">Vendo servicios</span>
          <span className="mt-1 block text-sm text-(--color-tinta-suave)">
            Entrar a mi panel de proveedor
          </span>
        </button>
      </div>
    </div>
  )
}
