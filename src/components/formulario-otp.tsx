'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  confirmarOtpAction,
  reenviarOtpAction,
  solicitarOtpEntrarAction,
  type EstadoOtp,
} from '@/server/otp'

const ESTADO_INICIAL: EstadoOtp = { ok: false }

const claseCampo =
  'w-full min-h-11 rounded-2xl border border-(--color-borde) px-3 py-2.5 text-base'

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-11 rounded-2xl bg-(--color-marca) px-5 py-3 font-semibold text-white disabled:opacity-60"
    >
      {pending ? 'Un segundo…' : children}
    </button>
  )
}

export function FormularioOtpCodigo({
  origen,
  telefono,
  telefonoEnmascarado,
  avisoInicial,
}: {
  origen: 'reclamo' | 'entrar' | 'proveedor'
  telefono?: string
  telefonoEnmascarado?: string
  avisoInicial?: string
}) {
  const [confirmacion, confirmar] = useActionState(confirmarOtpAction, ESTADO_INICIAL)
  const [reenvio, reenviar] = useActionState(reenviarOtpAction, ESTADO_INICIAL)
  const aviso = confirmacion.mensaje || reenvio.mensaje || avisoInicial

  return (
    <div className="mt-8 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
      <h2 className="font-medium">Confirma tu teléfono</h2>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        Te enviamos un código de 6 dígitos
        {telefonoEnmascarado ? ` a ${telefonoEnmascarado}` : ''}. Es tu entrada al panel: no hay
        contraseña.
      </p>

      <form action={confirmar} className="mt-4 space-y-3">
        <input type="hidden" name="origen" value={origen} />
        {telefono ? <input type="hidden" name="telefono" value={telefono} /> : null}
        <label htmlFor={`codigo-${origen}`} className="block text-sm font-medium">
          Código
        </label>
        <input
          id={`codigo-${origen}`}
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className={`${claseCampo} text-center font-mono text-lg tracking-[0.4em]`}
        />
        {aviso ? (
          <p role="status" className="text-sm text-(--color-tinta-suave)">
            {aviso}
          </p>
        ) : null}
        <Boton>
          {origen === 'reclamo'
            ? 'Confirmar y ver mi cotización'
            : origen === 'proveedor'
              ? 'Confirmar y ver mi cuenta'
              : 'Entrar'}
        </Boton>
      </form>

      <form action={reenviar} className="mt-3">
        <input type="hidden" name="origen" value={origen} />
        {telefono ? <input type="hidden" name="telefono" value={telefono} /> : null}
        <button type="submit" className="text-sm text-(--color-marca) underline-offset-4 hover:underline">
          Reenviar código
        </button>
      </form>
    </div>
  )
}

export function FormularioOtpEntrar() {
  const [telefono, setTelefono] = useState('')
  const [envio, pedir] = useActionState(solicitarOtpEntrarAction, ESTADO_INICIAL)

  if (envio.ok || envio.telefonoEnmascarado) {
    return (
      <FormularioOtpCodigo
        origen="entrar"
        telefono={telefono}
        telefonoEnmascarado={envio.telefonoEnmascarado}
        avisoInicial={envio.mensaje}
      />
    )
  }

  return (
    <form action={pedir} className="mt-8 space-y-3 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm">
      <label htmlFor="telefono-entrar" className="block text-sm font-medium">
        Teléfono
      </label>
      <input
        id="telefono-entrar"
        name="telefono"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+56 9 8123 4567"
        className={claseCampo}
        value={telefono}
        onChange={(event) => setTelefono(event.target.value)}
      />
      {envio.mensaje ? (
        <p role="alert" className="text-sm text-(--color-rojo)">
          {envio.mensaje}
        </p>
      ) : null}
      <Boton>Enviarme el código</Boton>
    </form>
  )
}
