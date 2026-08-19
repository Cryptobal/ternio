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
import { audienciasDe } from '@/lib/audiencia'
import { LARGO_MIN_PASSWORD_PROVEEDOR } from '@/lib/cuenta-proveedor'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_SUPERFICIE } from '@/lib/ui'

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
  const [busquedaRubro, setBusquedaRubro] = useState('')
  const errores = estado.errores ?? {}
  const rutOk = rut.length > 0 && esRutValido(rut)
  const passwordOk = password.length >= LARGO_MIN_PASSWORD_PROVEEDOR

  const rubrosFiltrados = rubros
    .filter((r) => {
      const q = busquedaRubro.trim().toLowerCase()
      if (!q) return true
      return r.nombre.toLowerCase().includes(q) || r.slug.includes(q)
    })
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const seleccionados = rubros
    .filter((r) => elegidos[r.slug])
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  function toggleRubro(slug: string, on: boolean) {
    setElegidos((prev) => ({ ...prev, [slug]: on }))
    if (on) {
      const rubro = rubros.find((r) => r.slug === slug)
      const tags = audienciasDe(rubro?.audiencias)
      setAudiencias((prev) => ({
        ...prev,
        [slug]: prev[slug] ?? {
          hogar: tags.includes('hogar'),
          empresa: tags.includes('empresa'),
        },
      }))
    }
  }

  function setAudienciaRubro(slug: string, modo: 'casa' | 'empresa' | 'ambas') {
    setAudiencias((prev) => ({
      ...prev,
      [slug]: {
        hogar: modo === 'casa' || modo === 'ambas',
        empresa: modo === 'empresa' || modo === 'ambas',
      },
    }))
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
      <p className="text-sm text-(--color-texto-suave)">
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
          <p className={`mt-1 text-sm ${rutOk ? 'text-(--color-verde)' : 'text-(--color-texto-suave)'}`}>
            {rutOk ? 'RUT válido' : 'Revisa el dígito verificador.'}
          </p>
        ) : null}
        {errores.rut ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.rut}</p> : null}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Rubros</legend>
        <input
          type="search"
          value={busquedaRubro}
          onChange={(e) => setBusquedaRubro(e.target.value)}
          placeholder="Buscar rubro"
          className={`${CLASE_CAMPO} mb-3`}
          aria-label="Buscar rubro"
        />
        <p className="mb-2 text-sm text-(--color-texto-suave)">
          {seleccionados.length} {seleccionados.length === 1 ? 'seleccionado' : 'seleccionados'}
        </p>
        <ul className="rejilla-fichas">
          {rubrosFiltrados.map((rubro) => {
            const marcado = Boolean(elegidos[rubro.slug])
            return (
              <li key={rubro.slug}>
                <button
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => toggleRubro(rubro.slug, !marcado)}
                  className={`ficha-simetrica w-full ${marcado ? 'border-(--color-boton) bg-(--color-ambar-suave)' : ''}`}
                >
                  <span
                    className={`ficha-simetrica__punto ${marcado ? '' : 'ficha-simetrica__punto--apagado'}`}
                    aria-hidden="true"
                  />
                  <span className="ficha-simetrica__texto">{rubro.nombre}</span>
                </button>
                {marcado ? <input type="hidden" name="rubros" value={rubro.slug} /> : null}
              </li>
            )
          })}
        </ul>
        {errores.rubros ? <p className="mt-1 text-sm text-(--color-rojo)">{errores.rubros}</p> : null}

        {seleccionados.length > 0 ? (
          <div className="mt-5">
            <p className="text-sm font-medium">Tus rubros</p>
            <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-(--color-borde) bg-(--color-superficie-2) p-3 [scrollbar-gutter:stable]">
              {seleccionados.map((rubro) => {
                const tags = audienciasDe(rubro.audiencias)
                const aud = audiencias[rubro.slug] ?? {
                  hogar: tags.includes('hogar'),
                  empresa: tags.includes('empresa'),
                }
                const soloUna = tags.length === 1
                const modoActual: 'casa' | 'empresa' | 'ambas' =
                  aud.hogar && aud.empresa ? 'ambas' : aud.hogar ? 'casa' : 'empresa'
                return (
                  <li
                    key={rubro.slug}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-(--color-borde) bg-(--color-superficie) px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 text-sm font-medium">{rubro.nombre}</span>
                    {soloUna ? (
                      <>
                        <span className="text-xs text-(--color-texto-suave)">
                          Solo {tags[0] === 'hogar' ? 'casa' : 'empresa'}
                        </span>
                        <input type="hidden" name={`audiencia:${rubro.slug}`} value={tags[0]!} />
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-1" role="group" aria-label={`Audiencia de ${rubro.nombre}`}>
                        {(
                          [
                            { id: 'empresa' as const, label: 'Empresa' },
                            { id: 'casa' as const, label: 'Casa' },
                            { id: 'ambas' as const, label: 'Ambas' },
                          ] as const
                        ).map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            aria-pressed={modoActual === op.id}
                            onClick={() => setAudienciaRubro(rubro.slug, op.id)}
                            className={`${CLASE_CHIP} min-h-10 px-3 py-1.5 text-xs ${modoActual === op.id ? CLASE_CHIP_ACTIVO : ''}`}
                          >
                            {op.label}
                          </button>
                        ))}
                        {aud.empresa ? (
                          <input type="hidden" name={`audiencia:${rubro.slug}`} value="empresa" />
                        ) : null}
                        {aud.hogar ? (
                          <input type="hidden" name={`audiencia:${rubro.slug}`} value="hogar" />
                        ) : null}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleRubro(rubro.slug, false)}
                      className="text-sm text-(--color-marca) underline-offset-2 hover:underline"
                    >
                      Quitar
                    </button>
                    {errores[`audiencia:${rubro.slug}`] ? (
                      <p className="w-full text-sm text-(--color-rojo)">
                        {errores[`audiencia:${rubro.slug}`]}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
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
          <p className={`mt-1 text-sm ${passwordOk ? 'text-(--color-verde)' : 'text-(--color-texto-suave)'}`}>
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
