'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { LogoProveedor } from '@/components/marca/logo-proveedor'
import { DESCRIPCION_MAX } from '@/lib/logo-proveedor'
import { CLASE_BOTON_SUAVE, CLASE_CAMPO, CLASE_SUPERFICIE } from '@/lib/ui'
import {
  actualizarFichaMarcaAction,
  quitarLogoMarcaAction,
  subirLogoMarcaAction,
  type ResultadoMarcaPanel,
} from '@/server/marca-proveedor'

const INICIAL: ResultadoMarcaPanel = { ok: false, mensaje: '' }

function BotonTexto({ etiqueta, pendingLabel }: { etiqueta: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 text-sm font-medium underline underline-offset-4 disabled:opacity-60"
    >
      {pending ? pendingLabel : etiqueta}
    </button>
  )
}

function BotonSuave({ etiqueta, pendingLabel }: { etiqueta: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`${CLASE_BOTON_SUAVE} w-auto px-4`}>
      {pending ? pendingLabel : etiqueta}
    </button>
  )
}

export function FormularioMarca({
  nombre,
  logoUrl,
  descripcion,
  sitioWeb,
}: {
  nombre: string
  logoUrl: string | null
  descripcion: string | null
  sitioWeb: string | null
}) {
  const [estadoFicha, accionFicha] = useActionState(actualizarFichaMarcaAction, INICIAL)
  const [estadoLogo, accionLogo] = useActionState(subirLogoMarcaAction, INICIAL)
  const [estadoQuitar, accionQuitar] = useActionState(quitarLogoMarcaAction, INICIAL)

  return (
    <section className={`mt-6 ${CLASE_SUPERFICIE}`}>
      <h2 className="font-display text-xl">Tu marca</h2>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        Logo y ficha que ven los compradores en la zona y en tu perfil público.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <LogoProveedor nombre={nombre} logoUrl={logoUrl} tamano="lg" />
        <div className="min-w-0 flex-1 space-y-3">
          <form action={accionLogo} className="flex flex-wrap items-end gap-3">
            <label className="block min-w-[12rem] flex-1 text-sm">
              <span className="font-medium">Logo</span>
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                required
                className={`${CLASE_CAMPO} mt-1 cursor-pointer file:mr-3 file:rounded-xl file:border-0 file:bg-(--color-superficie-2) file:px-3 file:py-1.5 file:text-sm`}
              />
            </label>
            <BotonSuave etiqueta="Subir" pendingLabel="Subiendo…" />
          </form>
          {logoUrl ? (
            <form action={accionQuitar}>
              <BotonTexto etiqueta="Quitar logo" pendingLabel="Quitando…" />
            </form>
          ) : null}
          <p className="text-xs text-(--color-tinta-suave)">PNG, JPG o WebP · máx. 1 MB · mejor cuadrado</p>
          {estadoLogo.mensaje ? (
            <p className={`text-sm ${estadoLogo.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
              {estadoLogo.mensaje}
            </p>
          ) : null}
          {estadoQuitar.mensaje ? (
            <p className={`text-sm ${estadoQuitar.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
              {estadoQuitar.mensaje}
            </p>
          ) : null}
        </div>
      </div>

      <form action={accionFicha} className="mt-6 grid gap-4">
        <label className="block text-sm">
          <span className="font-medium">Descripción corta</span>
          <textarea
            name="descripcion"
            rows={3}
            maxLength={DESCRIPCION_MAX}
            defaultValue={descripcion ?? ''}
            placeholder="Qué haces y en qué zonas."
            className={`${CLASE_CAMPO} mt-1 resize-y`}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Sitio web</span>
          <input
            type="url"
            name="sitioWeb"
            defaultValue={sitioWeb ?? ''}
            placeholder="https://tuempresa.cl"
            className={`${CLASE_CAMPO} mt-1`}
          />
        </label>
        <div>
          <BotonTexto etiqueta="Guardar ficha" pendingLabel="Guardando…" />
        </div>
        {estadoFicha.mensaje ? (
          <p className={`text-sm ${estadoFicha.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
            {estadoFicha.mensaje}
          </p>
        ) : null}
      </form>
    </section>
  )
}
