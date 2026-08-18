'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { LARGO_MIN_PASSWORD_PROVEEDOR } from '@/lib/cuenta-proveedor'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_SUPERFICIE } from '@/lib/ui'
import {
  cambiarPasswordProveedorAction,
  type EstadoPasswordProveedor,
} from '@/server/auth-acciones'

const ESTADO: EstadoPasswordProveedor = { ok: false }

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={CLASE_BOTON}>
      {pending ? 'Guardando…' : 'Guardar contraseña'}
    </button>
  )
}

export function FormularioCambiarPassword({ sinPassword }: { sinPassword: boolean }) {
  const [estado, accion] = useActionState(cambiarPasswordProveedorAction, ESTADO)

  return (
    <section className={`${CLASE_SUPERFICIE} mt-8`}>
      <h2 className="font-display text-xl">
        {sinPassword ? 'Crea una contraseña' : 'Cambiar contraseña'}
      </h2>
      {sinPassword ? (
        <p className="mt-2 text-sm text-(--color-tinta-suave)">
          Crea una contraseña para entrar sin depender del SMS.
        </p>
      ) : (
        <p className="mt-2 text-sm text-(--color-tinta-suave)">
          Si la olvidas, en V1 entra con el código al celular.
        </p>
      )}
      <form action={accion} className="mt-4 space-y-3">
        <div>
          <label htmlFor="password-panel" className="mb-1 block text-sm font-medium">
            Nueva contraseña
          </label>
          <input
            id="password-panel"
            name="password"
            type="password"
            autoComplete="new-password"
            className={CLASE_CAMPO}
            required
            minLength={LARGO_MIN_PASSWORD_PROVEEDOR}
          />
          {estado.errores?.password ? (
            <p className="mt-1 text-sm text-(--color-rojo)">{estado.errores.password}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="password-confirmacion-panel" className="mb-1 block text-sm font-medium">
            Confirma la contraseña
          </label>
          <input
            id="password-confirmacion-panel"
            name="passwordConfirmacion"
            type="password"
            autoComplete="new-password"
            className={CLASE_CAMPO}
            required
            minLength={LARGO_MIN_PASSWORD_PROVEEDOR}
          />
          {estado.errores?.passwordConfirmacion ? (
            <p className="mt-1 text-sm text-(--color-rojo)">{estado.errores.passwordConfirmacion}</p>
          ) : null}
        </div>
        {estado.mensaje ? (
          <p role="status" className="text-sm text-(--color-verde)">
            {estado.mensaje}
          </p>
        ) : null}
        <Boton />
      </form>
    </section>
  )
}
