'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Aparecer } from '@/components/ui/motion'
import { PACKS_CREDITOS } from '@/lib/creditos'
import { formatearClp } from '@/lib/dinero'
import { CLASE_SUPERFICIE } from '@/lib/ui'
import { iniciarPackAction, type EstadoPack } from '@/server/packs'

const INICIAL: EstadoPack = { ok: false, mensaje: '' }

function BotonPack({ etiqueta, monto }: { etiqueta: string; monto: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-16 w-full flex-col items-start rounded-2xl border border-(--color-borde) bg-(--color-papel) px-4 py-3 text-left transition hover:border-(--color-marca) disabled:opacity-60"
    >
      <span className="text-sm text-(--color-tinta-suave)">{pending ? 'Abriendo Flow…' : etiqueta}</span>
      <span className="font-display text-2xl">{monto}</span>
    </button>
  )
}

export function PacksCreditos({ pagosListos }: { pagosListos: boolean }) {
  const [estado, accion] = useActionState(iniciarPackAction, INICIAL)
  const listo = pagosListos

  return (
    <Aparecer>
      <section className={CLASE_SUPERFICIE}>
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
        <ul className="mt-4 grid gap-3">
          {PACKS_CREDITOS.map((pack) => (
            <li key={pack.id}>
              <form action={accion}>
                <input type="hidden" name="packId" value={pack.id} />
                <BotonPack etiqueta={pack.etiqueta} monto={formatearClp(pack.montoClp)} />
              </form>
            </li>
          ))}
        </ul>
        {estado.mensaje ? (
          <p className="mt-3 text-sm text-(--color-rojo)">{estado.mensaje}</p>
        ) : null}
      </section>
    </Aparecer>
  )
}
