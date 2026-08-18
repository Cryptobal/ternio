'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { CampoHoneypot } from '@/components/campo-honeypot'
import { FormularioOtpCodigo } from '@/components/formulario-otp'
import { SelectorCobertura } from '@/components/selector-cobertura'
import { claveProvincia, seleccionVacia, type SeleccionCobertura } from '@/lib/cobertura'
import { esRutValido } from '@/lib/rut'
import type { ComunaTerritorio } from '@/lib/territorio'
import { Aparecer } from '@/components/ui/motion'
import { crearCuentaProveedorAction, type EstadoCuentaProveedor } from '@/server/proveedores'
import { LARGO_MIN_PASSWORD_PROVEEDOR } from '@/lib/cuenta-proveedor'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CHIP, CLASE_SUPERFICIE } from '@/lib/ui'

const ESTADO_INICIAL: EstadoCuentaProveedor = { ok: false }

function BotonEnviar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={CLASE_BOTON}
    >
      {pending ? 'Creando tu cuenta…' : 'Crear cuenta'}
    </button>
  )
}

export function FormularioCuentaProveedor({
  rubros,
  comunas,
}: {
  rubros: { slug: string; nombre: string; audiencias?: string[] }[]
  comunas: ComunaTerritorio[]
}) {
  const [estado, accion] = useActionState(crearCuentaProveedorAction, ESTADO_INICIAL)
  const [cobertura, setCobertura] = useState<SeleccionCobertura>(seleccionVacia('nacional'))
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [elegidos, setElegidos] = useState<Record<string, boolean>>({})
  const [audiencias, setAudiencias] = useState<Record<string, { hogar: boolean; empresa: boolean }>>(
    {},
  )
  const errores = estado.errores ?? {}
  const rutOk = rut.length > 0 && esRutValido(rut)
  const passwordOk = password.length >= LARGO_MIN_PASSWORD_PROVEEDOR

  function toggleRubro(slug: string, on: boolean) {
    setElegidos((prev) => ({ ...prev, [slug]: on }))
    if (on) {
      setAudiencias((prev) => ({
        ...prev,
        [slug]: prev[slug] ?? { hogar: true, empresa: true },
      }))
    }
  }
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
    <Aparecer>
    <form action={accion} className={`${CLASE_SUPERFICIE} space-y-5`}>
      <h2 className="font-display text-2xl">Crea tu cuenta</h2>
      <p className="text-sm text-(--color-tinta-suave)">
        Confirmas el celular con un código OTP. Después de eso puedes tomar contactos.
      </p>

      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="rounded-2xl bg-(--color-rojo-suave) px-4 py-3 text-sm text-(--color-rojo)">
          {estado.mensaje}
        </p>
      ) : null}

      <CampoHoneypot id="sitio_web_proveedor" />

      <div>
        <label htmlFor="nombreEmpresa" className="mb-1 block text-sm font-medium">
          Nombre de la empresa
        </label>
        <input id="nombreEmpresa" name="nombreEmpresa" className={CLASE_CAMPO} required />
        {errores.nombreEmpresa ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.nombreEmpresa}</p> : null}
      </div>

      <div>
        <label htmlFor="rut-proveedor" className="mb-1 block text-sm font-medium">
          RUT
        </label>
        <input
          id="rut-proveedor"
          name="rut"
          className={CLASE_CAMPO}
          placeholder="76.482.113-0"
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
        <ul className="grid gap-3">
          {rubros.map((rubro) => {
            const marcado = Boolean(elegidos[rubro.slug])
            const aud = audiencias[rubro.slug] ?? { hogar: true, empresa: true }
            return (
              <li key={rubro.slug} className="rounded-2xl border border-(--color-borde) p-3">
                <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="rubros"
                    value={rubro.slug}
                    checked={marcado}
                    onChange={(e) => toggleRubro(rubro.slug, e.target.checked)}
                  />
                  <span>{rubro.nombre}</span>
                </label>
                {marcado ? (
                  <div className="mt-2 flex flex-wrap gap-2 pl-7">
                    <label className={`${CLASE_CHIP} inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm`}>
                      <input
                        type="checkbox"
                        name={`audiencia:${rubro.slug}`}
                        value="empresa"
                        checked={aud.empresa}
                        onChange={(e) =>
                          setAudiencias((prev) => ({
                            ...prev,
                            [rubro.slug]: { ...aud, empresa: e.target.checked },
                          }))
                        }
                      />
                      Empresa
                    </label>
                    <label className={`${CLASE_CHIP} inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm`}>
                      <input
                        type="checkbox"
                        name={`audiencia:${rubro.slug}`}
                        value="hogar"
                        checked={aud.hogar}
                        onChange={(e) =>
                          setAudiencias((prev) => ({
                            ...prev,
                            [rubro.slug]: { ...aud, hogar: e.target.checked },
                          }))
                        }
                      />
                      Casa
                    </label>
                  </div>
                ) : null}
                {errores[`audiencia:${rubro.slug}`] ? (
                  <p className="mt-1 text-sm text-(--color-rojo)">{errores[`audiencia:${rubro.slug}`]}</p>
                ) : null}
              </li>
            )
          })}
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
          className={CLASE_CAMPO}
          placeholder="+56 9 8123 4567"
          required
        />
        {errores.telefono ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.telefono}</p> : null}
      </div>

      <div>
        <label htmlFor="email-proveedor" className="mb-1 block text-sm font-medium">
          Correo
        </label>
        <input id="email-proveedor" name="email" type="email" className={CLASE_CAMPO} required />
        {errores.email ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.email}</p> : null}
      </div>

      <div>
        <label htmlFor="password-proveedor" className="mb-1 block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password-proveedor"
          name="password"
          type="password"
          autoComplete="new-password"
          className={CLASE_CAMPO}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={LARGO_MIN_PASSWORD_PROVEEDOR}
        />
        {password ? (
          <p className={`mt-1 text-sm ${passwordOk ? 'text-(--color-verde)' : 'text-(--color-tinta-suave)'}`}>
            {passwordOk
              ? 'Listo: cumple el mínimo.'
              : `Mínimo ${LARGO_MIN_PASSWORD_PROVEEDOR} caracteres.`}
          </p>
        ) : null}
        {errores.password ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.password}</p> : null}
      </div>

      <div>
        <label htmlFor="password-confirmacion-proveedor" className="mb-1 block text-sm font-medium">
          Confirma la contraseña
        </label>
        <input
          id="password-confirmacion-proveedor"
          name="passwordConfirmacion"
          type="password"
          autoComplete="new-password"
          className={CLASE_CAMPO}
          required
          minLength={LARGO_MIN_PASSWORD_PROVEEDOR}
        />
        {errores.passwordConfirmacion ? (
          <p className="mt-1 text-sm text-(--color-rojo)">{errores.passwordConfirmacion}</p>
        ) : null}
      </div>

      <BotonEnviar />
    </form>
    </Aparecer>
  )
}
