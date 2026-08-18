'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ModoRubro } from '@prisma/client'

import { serializarCamposAdmin } from '@/lib/admin-rubros'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_SUPERFICIE } from '@/lib/ui'
import {
  crearRubroAction,
  desactivarRubroAction,
  editarRubroAction,
  type ResultadoRubroAdmin,
} from '@/server/admin-rubros'

const INICIAL: ResultadoRubroAdmin = { ok: false, mensaje: '' }

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={CLASE_BOTON}>
      {pending ? 'Guardando…' : children}
    </button>
  )
}

type RubroForm = {
  id?: string
  slug?: string
  nombre: string
  nombrePlural: string | null
  descripcion: string | null
  modo: ModoRubro
  activo: boolean
  orden: number
  precioExclusivoClp: number | null
  precioCompartidoClp: number | null
  camposFormulario?: unknown
}

export function FormularioRubro({ rubro }: { rubro?: RubroForm }) {
  const esEdicion = Boolean(rubro?.id)
  const [estado, accion] = useActionState(esEdicion ? editarRubroAction : crearRubroAction, INICIAL)
  const [baja, desactivar] = useActionState(desactivarRubroAction, INICIAL)
  const [camposJson, setCamposJson] = useState(serializarCamposAdmin(rubro?.camposFormulario))
  const errores = estado.errores ?? {}

  return (
    <div className="grid gap-6">
      <form action={accion} className={`${CLASE_SUPERFICIE} grid gap-4`}>
        {esEdicion ? <input type="hidden" name="id" value={rubro?.id} /> : null}

        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            className={CLASE_CAMPO}
            defaultValue={rubro?.nombre}
            required
          />
          {errores.nombre ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.nombre}</p> : null}
        </div>

        <div>
          <label htmlFor="nombrePlural" className="mb-1 block text-sm font-medium">
            Nombre en plural
          </label>
          <input
            id="nombrePlural"
            name="nombrePlural"
            className={CLASE_CAMPO}
            defaultValue={rubro?.nombrePlural ?? ''}
          />
        </div>

        {esEdicion ? (
          <p className="text-sm text-(--color-tinta-suave)">
            Slug: <span className="font-medium text-(--color-tinta)">{rubro?.slug}</span> (no se
            cambia, para no romper las URLs).
          </p>
        ) : (
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium">
              Slug (opcional)
            </label>
            <input id="slug" name="slug" className={CLASE_CAMPO} placeholder="se arma del nombre" />
            {errores.slug ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.slug}</p> : null}
          </div>
        )}

        <div>
          <label htmlFor="descripcion" className="mb-1 block text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            className={CLASE_CAMPO}
            defaultValue={rubro?.descripcion ?? ''}
          />
        </div>

        <div>
          <label htmlFor="modo" className="mb-1 block text-sm font-medium">
            Modo
          </label>
          <select id="modo" name="modo" className={CLASE_CAMPO} defaultValue={rubro?.modo ?? 'CAPTURA'}>
            <option value="CAPTURA">CAPTURA — lista de espera, no se vende</option>
            <option value="VENTA">VENTA — aparece en cotizador y /proveedores</option>
          </select>
          {errores.modo ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.modo}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="precioExclusivoClp" className="mb-1 block text-sm font-medium">
              Precio exclusivo (CLP)
            </label>
            <input
              id="precioExclusivoClp"
              name="precioExclusivoClp"
              className={CLASE_CAMPO}
              inputMode="numeric"
              defaultValue={rubro?.precioExclusivoClp ?? ''}
            />
            {errores.precioExclusivoClp ? (
              <p className="mt-1 text-sm text-(--color-rojo)">{errores.precioExclusivoClp}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="precioCompartidoClp" className="mb-1 block text-sm font-medium">
              Precio compartido (CLP)
            </label>
            <input
              id="precioCompartidoClp"
              name="precioCompartidoClp"
              className={CLASE_CAMPO}
              inputMode="numeric"
              defaultValue={rubro?.precioCompartidoClp ?? ''}
            />
            {errores.precioCompartidoClp ? (
              <p className="mt-1 text-sm text-(--color-rojo)">{errores.precioCompartidoClp}</p>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-(--color-tinta-suave)">
          VENTA exige ambos precios mayores a $0. CAPTURA no.
        </p>

        <div>
          <label htmlFor="orden" className="mb-1 block text-sm font-medium">
            Orden
          </label>
          <input
            id="orden"
            name="orden"
            className={CLASE_CAMPO}
            inputMode="numeric"
            defaultValue={rubro?.orden ?? 100}
          />
        </div>

        <div>
          <label htmlFor="camposFormulario" className="mb-1 block text-sm font-medium">
            Campos del cotizador (JSON)
          </label>
          <textarea
            id="camposFormulario"
            name="camposFormulario"
            rows={10}
            spellCheck={false}
            className={`${CLASE_CAMPO} font-mono text-sm`}
            value={camposJson}
            onChange={(event) => setCamposJson(event.target.value)}
          />
          <p className="mt-1 text-sm text-(--color-tinta-suave)">
            Vacío o <code>[]</code> deja solo el tronco (razón social, RUT, nombre, teléfono,
            correo). Máximo 6 preguntas. JSON inválido no se guarda.
          </p>
          {errores.camposFormulario ? (
            <p className="mt-1 text-sm text-(--color-rojo)">{errores.camposFormulario}</p>
          ) : null}
        </div>

        {esEdicion ? (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="activo" value="true" defaultChecked={rubro?.activo} />
            Activo (si lo apagas, desaparece del cotizador y de /proveedores)
          </label>
        ) : null}

        {estado.mensaje ? (
          <p className={`text-sm ${estado.ok ? 'text-(--color-verde)' : 'text-(--color-rojo)'}`}>
            {estado.mensaje}
          </p>
        ) : null}

        <Boton>{esEdicion ? 'Guardar cambios' : 'Crear rubro'}</Boton>
      </form>

      {esEdicion && rubro?.activo ? (
        <form action={desactivar} className={CLASE_SUPERFICIE}>
          <input type="hidden" name="id" value={rubro.id} />
          <p className="text-sm text-(--color-tinta-suave)">
            No se borra. Queda inactivo: las cotizaciones viejas se conservan.
          </p>
          <button
            type="submit"
            className="mt-3 min-h-11 text-sm font-medium text-(--color-rojo) underline underline-offset-4"
          >
            Desactivar rubro
          </button>
          {baja.mensaje ? <p className="mt-2 text-sm">{baja.mensaje}</p> : null}
        </form>
      ) : null}
    </div>
  )
}
