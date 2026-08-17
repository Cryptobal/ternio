'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { entrarComoAdmin, type EstadoLoginAdmin } from '@/server/auth-acciones'

const ESTADO_INICIAL: EstadoLoginAdmin = {}

const claseCampo =
  'w-full rounded-lg border border-(--color-borde) bg-white px-3 py-2.5 text-base outline-none focus:border-(--color-marca)'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-(--color-marca) px-5 py-3 font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  )
}

export function FormularioLoginAdmin() {
  const [estado, accion] = useActionState(entrarComoAdmin, ESTADO_INICIAL)

  return (
    <form action={accion} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Correo
        </label>
        <input id="email" name="email" type="email" autoComplete="username" className={claseCampo} />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={claseCampo}
        />
      </div>

      {estado.error ? (
        <p role="alert" className="text-sm text-red-700">
          {estado.error}
        </p>
      ) : null}

      <Boton />
    </form>
  )
}
