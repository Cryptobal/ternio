'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { FormularioOtpCodigo } from '@/components/formulario-otp'
import { SelectorCobertura } from '@/components/selector-cobertura'
import { claveProvincia, seleccionVacia, type SeleccionCobertura } from '@/lib/cobertura'
import { esRutValido } from '@/lib/rut'
import type { ComunaTerritorio } from '@/lib/territorio'
import { crearCuentaProveedorAction, type EstadoCuentaProveedor } from '@/server/proveedores'

const ESTADO_INICIAL: EstadoCuentaProveedor = { ok: false }

const claseCampo =
  'w-full min-h-11 rounded-2xl border border-(--color-borde) bg-white px-3 py-2.5 text-base outline-none'

function BotonEnviar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-11 rounded-2xl bg-(--color-marca) px-5 py-3.5 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Creando tu cuenta…' : 'Crear cuenta'}
    </button>
  )
}

export function FormularioCuentaProveedor({
  rubros,
  comunas,
}: {
  rubros: { slug: string; nombre: string }[]
  comunas: ComunaTerritorio[]
}) {
  const [estado, accion] = useActionState(crearCuentaProveedorAction, ESTADO_INICIAL)
  const [cobertura, setCobertura] = useState<SeleccionCobertura>(seleccionVacia('nacional'))
  const [rut, setRut] = useState('')
  const errores = estado.errores ?? {}
  const rutOk = rut.length > 0 && esRutValido(rut)

  if (estado.ok && estado.requiereOtp) {
    return (
      <FormularioOtpCodigo
        origen="proveedor"
        telefono={estado.telefono}
        telefonoEnmascarado={estado.telefonoEnmascarado}
        avisoInicial={estado.mensaje}
      />
    )
  }

  return (
    <form action={accion} className="space-y-4 rounded-2xl border border-(--color-borde) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl">Crea tu cuenta</h2>
      <p className="text-sm text-(--color-tinta-suave)">
        Confirmas el celular con un código. Aún no hay marketplace ni venta de leads.
      </p>

      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="rounded-2xl bg-(--color-rojo-suave) px-4 py-3 text-sm text-(--color-rojo)">
          {estado.mensaje}
        </p>
      ) : null}

      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="sitio_web_proveedor">No completar</label>
        <input id="sitio_web_proveedor" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="nombreEmpresa" className="mb-1 block text-sm font-medium">
          Nombre de la empresa
        </label>
        <input id="nombreEmpresa" name="nombreEmpresa" className={claseCampo} required />
        {errores.nombreEmpresa ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.nombreEmpresa}</p> : null}
      </div>

      <div>
        <label htmlFor="rut-proveedor" className="mb-1 block text-sm font-medium">
          RUT
        </label>
        <input
          id="rut-proveedor"
          name="rut"
          className={claseCampo}
          placeholder="76.482.113-5"
          value={rut}
          onChange={(event) => setRut(event.target.value)}
          required
        />
        {rut ? (
          <p className={`mt-1 text-sm ${rutOk ? 'text-(--color-verde)' : 'text-(--color-tinta-suave)'}`}>
            {rutOk ? 'RUT válido' : 'Revisa el dígito verificador.'}
          </p>
        ) : null}
        {errores.rut ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.rut}</p> : null}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Rubros</legend>
        <ul className="grid gap-2">
          {rubros.map((rubro) => (
            <li key={rubro.slug}>
              <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-(--color-borde) px-3 py-2">
                <input type="checkbox" name="rubros" value={rubro.slug} />
                <span>{rubro.nombre}</span>
              </label>
            </li>
          ))}
        </ul>
        {errores.rubros ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.rubros}</p> : null}
      </fieldset>

      <div>
        <SelectorCobertura comunas={comunas} value={cobertura} onChange={setCobertura} />
        <input type="hidden" name="modoCobertura" value={cobertura.modo} />
        {cobertura.regiones.map((region) => (
          <input key={region} type="hidden" name="regiones" value={region} />
        ))}
        {cobertura.provincias.map((item) => (
          <input key={claveProvincia(item)} type="hidden" name="provincias" value={claveProvincia(item)} />
        ))}
        {cobertura.comunas.map((slug) => (
          <input key={slug} type="hidden" name="comunas" value={slug} />
        ))}
        {errores.cobertura ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.cobertura}</p> : null}
      </div>

      <div>
        <label htmlFor="telefono-proveedor" className="mb-1 block text-sm font-medium">
          Celular
        </label>
        <input
          id="telefono-proveedor"
          name="telefono"
          type="tel"
          inputMode="tel"
          className={claseCampo}
          placeholder="+56 9 8123 4567"
          required
        />
        {errores.telefono ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.telefono}</p> : null}
      </div>

      <div>
        <label htmlFor="email-proveedor" className="mb-1 block text-sm font-medium">
          Correo
        </label>
        <input id="email-proveedor" name="email" type="email" className={claseCampo} required />
        {errores.email ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.email}</p> : null}
      </div>

      <BotonEnviar />
    </form>
  )
}
