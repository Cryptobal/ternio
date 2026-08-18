'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { PACKS_CREDITOS } from '@/lib/creditos'
import { formatearClp } from '@/lib/dinero'
import { iniciarPackAction, type EstadoPack } from '@/server/packs'

const INICIAL: EstadoPack = { ok: false, mensaje: '' }

function BotonPack({ etiqueta }: { etiqueta: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 w-full rounded-2xl border border-(--color-borde) bg-white px-4 py-3 text-base font-semibold disabled:opacity-60"
    >
      {pending ? 'Abriendo Flow…' : etiqueta}
    </button>
  )
}

export function PacksCreditos({ pagosListos }: { pagosListos: boolean }) {
  const [estado, accion] = useActionState(iniciarPackAction, INICIAL)
  const listo = pagosListos

  return (
    <section className="rounded-2xl border border-(--color-borde) bg-white p-5">
      <h2 className="font-display text-xl">Recargar créditos</h2>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        1 crédito = $1. Los créditos no vencen.
      </p>
      {!listo ? (
        <p className="mt-3 text-sm text-(--color-tinta-suave)">
          El pago con Flow todavía no está configurado en este entorno. El pack
          de arranque ya está en tu saldo.
        </p>
      ) : null}
      <ul className="mt-4 grid gap-2">
        {PACKS_CREDITOS.map((pack) => (
          <li key={pack.id}>
            <form action={accion}>
              <input type="hidden" name="packId" value={pack.id} />
              <BotonPack etiqueta={`${pack.etiqueta} · ${formatearClp(pack.montoClp)}`} />
            </form>
          </li>
        ))}
      </ul>
      {estado.mensaje ? (
        <p className="mt-3 text-sm text-(--color-rojo)">{estado.mensaje}</p>
      ) : null}
    </section>
  )
}
