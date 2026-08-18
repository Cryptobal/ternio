'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

import { formatearClp } from '@/lib/dinero'
import { CUPOS_COMPARTIDO, resumenConfirmacionCompra } from '@/lib/matching'
import { tomarLeadAction, type LeadPanelDisponible, type ResultadoToma } from '@/server/marketplace'

const INICIAL: ResultadoToma = { ok: false, mensaje: '' }

type Seleccion = 'EXCLUSIVO' | 'COMPARTIDO'

function BotonConfirmar({ etiqueta }: { etiqueta: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-12 rounded-2xl bg-(--color-marca) px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
    >
      {pending ? 'Tomando…' : etiqueta}
    </button>
  )
}

export function TomarLead({
  lead,
  saldo,
}: {
  lead: LeadPanelDisponible
  saldo: number
}) {
  const [estado, accion] = useActionState(tomarLeadAction, INICIAL)
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)

  if (lead.reservadoGard) {
    return (
      <p className="mt-4 rounded-2xl bg-(--color-ambar-suave) px-4 py-3 text-sm">
        Disponible en {lead.disponibleEnMin} min.
      </p>
    )
  }

  const precioSeleccionado =
    seleccion === 'EXCLUSIVO'
      ? lead.precioExclusivo
      : seleccion === 'COMPARTIDO'
        ? lead.precioCompartido
        : null

  const resumen =
    precioSeleccionado != null ? resumenConfirmacionCompra(saldo, precioSeleccionado) : null

  const exclusivoBloqueado = lead.cuposRestantes < CUPOS_COMPARTIDO

  return (
    <div className="mt-4 grid gap-2">
      {!seleccion ? (
        <>
          {lead.precioCompartido ? (
            <button
              type="button"
              onClick={() => setSeleccion('COMPARTIDO')}
              disabled={!lead.puedeCompartido}
              className="w-full min-h-12 rounded-2xl bg-(--color-marca) px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              Compartido {formatearClp(lead.precioCompartido)} · quedan {lead.cuposRestantes} de{' '}
              {CUPOS_COMPARTIDO}
            </button>
          ) : null}

          {lead.precioExclusivo ? (
            exclusivoBloqueado || !lead.puedeExclusivo ? (
              <div className="rounded-2xl border border-(--color-borde) bg-(--color-papel) px-4 py-3 text-sm text-(--color-tinta-suave)">
                <p className="font-medium text-(--color-tinta)">
                  Exclusivo {formatearClp(lead.precioExclusivo)} · no disponible
                </p>
                <p className="mt-1">
                  Ya hay compradores compartidos: el exclusivo no está disponible.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSeleccion('EXCLUSIVO')}
                className="w-full min-h-12 rounded-2xl border border-(--color-borde) bg-white px-4 py-3 text-base font-semibold transition hover:border-(--color-marca)"
              >
                Exclusivo {formatearClp(lead.precioExclusivo)}
              </button>
            )
          ) : null}
        </>
      ) : resumen && precioSeleccionado != null ? (
        <div className="rounded-2xl border border-(--color-borde) bg-(--color-papel) p-4">
          <p className="font-medium">
            {seleccion === 'EXCLUSIVO' ? 'Exclusivo' : 'Compartido'} ·{' '}
            {formatearClp(precioSeleccionado)}
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-(--color-tinta-suave)">Saldo actual</dt>
              <dd>{formatearClp(saldo)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-(--color-tinta-suave)">Saldo después</dt>
              <dd className="font-medium">
                {resumen.alcanza ? formatearClp(resumen.saldoDespues) : '—'}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-(--color-tinta-suave)">
            Al confirmar se descuentan los créditos y se revela el contacto.
          </p>

          {resumen.alcanza ? (
            <form action={accion} className="mt-4 grid gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="tipo" value={seleccion} />
              <BotonConfirmar
                etiqueta={`Confirmar y ver el contacto · ${formatearClp(precioSeleccionado)}`}
              />
              <button
                type="button"
                onClick={() => setSeleccion(null)}
                className="min-h-11 text-sm underline underline-offset-4"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="mt-4 grid gap-2">
              <p className="text-sm text-(--color-rojo)">
                Te faltan {formatearClp(resumen.faltante)}.
              </p>
              <Link
                href="#recargar"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-(--color-marca) px-4 py-3 text-center font-semibold text-white"
              >
                Recargar créditos
              </Link>
              <button
                type="button"
                onClick={() => setSeleccion(null)}
                className="min-h-11 text-sm underline underline-offset-4"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      ) : null}

      {estado.mensaje ? (
        <p className={`text-sm ${estado.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
          {estado.mensaje}
        </p>
      ) : null}
    </div>
  )
}
