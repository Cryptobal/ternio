'use client'

import Link from 'next/link'
import { useActionState, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  audienciaInicialParaPagina,
  AUDIENCIAS,
  ETIQUETA_AUDIENCIA,
  PREGUNTA_AUDIENCIA,
  type Audiencia,
} from '@/lib/audiencia'
import type { CampoFormulario } from '@/lib/campos'
import {
  construirPasos,
  errorDePaso,
  etiquetaAvancePaso,
  mostrarBotonAvance,
  TRONCO_IDENTIDAD,
  valorComoTexto,
  type PasoCotizacion,
  type ValoresFormulario,
} from '@/lib/pasos-cotizacion'
import { progresoFases } from '@/lib/fases-cotizacion'
import { esRutValido } from '@/lib/rut'
import { crearLeadAction, type EstadoFormulario } from '@/server/leads'
import { CampoHoneypot } from '@/components/campo-honeypot'
import { registrarEventoCliente } from '@/components/medidor-embudo'
import { SelectorTerritorio } from '@/components/selector-territorio'
import { PasoAnimado } from '@/components/ui/motion'
import { RielFases } from '@/components/ui/riel-fases'
import { Turnstile } from '@/components/turnstile'
import type { ComunaTerritorio } from '@/lib/territorio'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_SUPERFICIE } from '@/lib/ui'

const ESTADO_INICIAL: EstadoFormulario = { ok: false }

function BotonEnviar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={CLASE_BOTON}
    >
      {pending ? 'Enviando tu cotización…' : 'Pedir cotización gratis'}
    </button>
  )
}

function Error({ mensaje }: { mensaje: string | undefined }) {
  if (!mensaje) return null
  return <p className="mt-2 text-sm text-(--color-rojo)">{mensaje}</p>
}

function Chip({
  seleccionado,
  children,
  onClick,
}: {
  seleccionado?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${CLASE_CHIP} ${seleccionado ? CLASE_CHIP_ACTIVO : ''}`}
    >
      {children}
    </button>
  )
}

export function FormularioCotizacion({
  rubroSlug,
  comunaSlug,
  comunas = [],
  campos,
  audienciasRubro = ['empresa'],
  audienciaInicial,
  turnstileSiteKey,
}: {
  rubroSlug: string
  comunaSlug?: string
  comunas?: ComunaTerritorio[]
  campos: CampoFormulario[]
  audienciasRubro?: readonly string[]
  audienciaInicial?: string | null
  turnstileSiteKey: string | undefined
}) {
  const pasos = useMemo(
    () => construirPasos(campos, { pideComuna: !comunaSlug }),
    [campos, comunaSlug],
  )
  const [indice, setIndice] = useState(0)
  const [valores, setValores] = useState<ValoresFormulario>(
    comunaSlug ? { comuna: comunaSlug } : {},
  )
  const [estado, accion] = useActionState(crearLeadAction, ESTADO_INICIAL)
  const [comenzado, setComenzado] = useState(false)
  const [errorPaso, setErrorPaso] = useState<string | undefined>()
  const [audiencia, setAudiencia] = useState<Audiencia | ''>(() =>
    audienciaInicialParaPagina(audienciasRubro, audienciaInicial),
  )
  const errores = estado.errores ?? {}
  const resumenRef = useRef<HTMLDivElement>(null)
  const paso = pasos[indice] as PasoCotizacion
  const total = pasos.length
  const tramos = useMemo(
    () => progresoFases(pasos, indice, { necesidadPrevia: Boolean(comunaSlug) }),
    [pasos, indice, comunaSlug],
  )
  const errorServidor =
    paso.tipo === 'modulo'
      ? errores[paso.campo.nombre]
      : paso.tipo === 'tronco'
        ? errores[paso.id]
        : paso.tipo === 'comuna'
          ? errores.comuna
          : undefined
  const errorVisible = errorPaso ?? errorServidor

  function marcarInicio() {
    if (comenzado) return
    setComenzado(true)
    registrarEventoCliente('FORM_START', { rubro: rubroSlug, comuna: comunaSlug ?? '' })
  }

  function guardar(id: string, valor: string | string[], avanzar: boolean) {
    const siguientes = { ...valores, [id]: valor }
    setValores(siguientes)
    setErrorPaso(undefined)
    if (avanzar) intentarAvanzar(siguientes)
  }

  function intentarAvanzar(siguientes: ValoresFormulario = valores) {
    const error = errorDePaso(paso, siguientes)
    if (error) {
      setErrorPaso(error)
      return
    }
    setErrorPaso(undefined)
    if (indice < total - 1) setIndice((actual) => actual + 1)
  }

  const comunaActual = valorComoTexto(valores.comuna) || comunaSlug || ''

  return (
    <form action={accion} onFocusCapture={marcarInicio} className="space-y-5" noValidate>
      <input type="hidden" name="rubro" value={rubroSlug} />
      <input type="hidden" name="comuna" value={comunaActual} />
      {audiencia ? <input type="hidden" name="audiencia" value={audiencia} /> : null}

      {!audiencia ? (
        <fieldset className={CLASE_SUPERFICIE}>
          <legend className="text-lg font-medium">{PREGUNTA_AUDIENCIA}</legend>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {AUDIENCIAS.map((opcion) => (
              <li key={opcion}>
                <Chip
                  seleccionado={false}
                  onClick={() => {
                    setAudiencia(opcion)
                    setErrorPaso(undefined)
                    marcarInicio()
                  }}
                >
                  {ETIQUETA_AUDIENCIA[opcion]}
                </Chip>
              </li>
            ))}
          </ul>
          <Error mensaje={errores.audiencia} />
        </fieldset>
      ) : (
        <>
      <RielFases tramos={tramos} variante="claro" />
      {TRONCO_IDENTIDAD.map((campo) => (
        <input
          key={campo.id}
          type="hidden"
          name={campo.id}
          value={valorComoTexto(valores[campo.id])}
        />
      ))}
      {Object.entries(valores).map(([clave, valor]) =>
        clave === 'comuna' || TRONCO_IDENTIDAD.some((campo) => campo.id === clave) ? null : Array.isArray(
            valor,
          ) ? (
          valor.map((item) => <input key={`${clave}-${item}`} type="hidden" name={clave} value={item} />)
        ) : (
          <input key={clave} type="hidden" name={clave} value={valor} />
        ),
      )}

      {estado.mensaje && !estado.ok ? (
        <div
          ref={resumenRef}
          role="alert"
          className="rounded-2xl border border-(--color-rojo) bg-(--color-rojo-suave) px-4 py-3 text-sm text-(--color-rojo)"
        >
          {estado.mensaje}
        </div>
      ) : null}

      <PasoAnimado
        id={
          paso.tipo === 'modulo'
            ? paso.campo.nombre
            : paso.tipo === 'tronco'
              ? paso.id
              : paso.tipo
        }
      >
        <div className={CLASE_SUPERFICIE}>
          {paso.tipo === 'comuna' ? (
            <fieldset>
              <legend className="text-lg font-medium">{paso.etiqueta}</legend>
              <div className="mt-3">
                <SelectorTerritorio
                  comunas={comunas}
                  value={comunaActual}
                  onChange={(slug) => {
                    if (slug) guardar('comuna', slug, true)
                  }}
                />
              </div>
              <Error mensaje={errorVisible} />
            </fieldset>
          ) : null}

          {paso.tipo === 'modulo' ? (
            <PasoModulo
              campo={paso.campo}
              valor={valores[paso.campo.nombre]}
              error={errorVisible}
              onElegir={(valor, avanzar) => guardar(paso.campo.nombre, valor, avanzar)}
            />
          ) : null}

          {paso.tipo === 'tronco' ? (
            <PasoTronco
              id={paso.id}
              etiqueta={paso.etiqueta}
              requerido={paso.requerido}
              valor={valorComoTexto(valores[paso.id])}
              error={errorVisible}
              onChange={(valor) => guardar(paso.id, valor, false)}
              onContinuar={() => intentarAvanzar()}
            />
          ) : null}

          {paso.tipo === 'envio' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Listo para enviar</h2>
              <p className="text-sm text-(--color-tinta-suave)">
                Revisamos el RUT y te vamos a pedir confirmar el teléfono con un código. Tus
                datos no se muestran a nadie hasta que una empresa tome tu solicitud.
              </p>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="whatsappOptIn"
                  className="mt-1 size-4 rounded border-(--color-borde)"
                />
                <span>Quiero que me escriban por WhatsApp para coordinar más rápido.</span>
              </label>
              <Turnstile siteKey={turnstileSiteKey} />
              <BotonEnviar />
            </div>
          ) : null}
        </div>
      </PasoAnimado>

      <div className="flex items-center justify-between gap-3">
        {indice > 0 ? (
          <button
            type="button"
            onClick={() => setIndice((actual) => actual - 1)}
            className="min-h-11 text-sm font-medium text-(--color-marca) underline-offset-4 hover:underline"
          >
            Volver
          </button>
        ) : (
          <span />
        )}
        {mostrarBotonAvance(paso, valores) ? (
          <button
            type="button"
            onClick={() => intentarAvanzar()}
            className="min-h-11 rounded-2xl bg-(--color-marca) px-5 py-2.5 text-sm font-semibold text-white"
          >
            {etiquetaAvancePaso(paso, valores)}
          </button>
        ) : null}
      </div>
        </>
      )}

      <p className="text-sm text-(--color-tinta-suave)">
        Cotizar es gratis. Este cotizador por pasos necesita JavaScript. Revisa cómo tratamos
        tus datos en la{' '}
        <Link href="/privacidad" className="underline underline-offset-4">
          política de privacidad
        </Link>
        .
      </p>
      <CampoHoneypot />
    </form>
  )
}

function PasoModulo({
  campo,
  valor,
  error,
  onElegir,
}: {
  campo: CampoFormulario
  valor: string | string[] | undefined
  error: string | undefined
  onElegir: (valor: string | string[], avanzar: boolean) => void
}) {
  const texto = valorComoTexto(valor)
  const multiples = Array.isArray(valor) ? valor : texto ? texto.split(',').filter(Boolean) : []

  if (campo.tipo === 'si_no') {
    return (
      <fieldset>
        <legend className="text-lg font-medium">
          {campo.etiqueta}
          {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
        </legend>
        <div className="mt-3 grid gap-2">
          {[
            { valor: 'si', etiqueta: 'Sí' },
            { valor: 'no', etiqueta: 'No' },
          ].map((opcion) => (
            <Chip
              key={opcion.valor}
              seleccionado={texto === opcion.valor}
              onClick={() => onElegir(opcion.valor, true)}
            >
              {opcion.etiqueta}
            </Chip>
          ))}
        </div>
        {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
        <Error mensaje={error} />
      </fieldset>
    )
  }

  if (campo.tipo === 'select' || campo.tipo === 'radio') {
    return (
      <fieldset>
        <legend className="text-lg font-medium">
          {campo.etiqueta}
          {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
        </legend>
        <div className="mt-3 grid gap-2">
          {campo.opciones?.map((opcion) => (
            <Chip
              key={opcion.valor}
              seleccionado={texto === opcion.valor}
              onClick={() => onElegir(opcion.valor, true)}
            >
              {opcion.etiqueta}
            </Chip>
          ))}
        </div>
        {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
        <Error mensaje={error} />
      </fieldset>
    )
  }

  if (campo.tipo === 'opcion_multiple') {
    return (
      <fieldset>
        <legend className="text-lg font-medium">
          {campo.etiqueta}
          {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
        </legend>
        <div className="mt-3 grid gap-2">
          {campo.opciones?.map((opcion) => {
            const activo = multiples.includes(opcion.valor)
            return (
              <Chip
                key={opcion.valor}
                seleccionado={activo}
                onClick={() => {
                  const siguiente = activo
                    ? multiples.filter((item) => item !== opcion.valor)
                    : [...multiples, opcion.valor]
                  onElegir(siguiente, false)
                }}
              >
                {opcion.etiqueta}
              </Chip>
            )
          })}
        </div>
        {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
        <Error mensaje={error} />
      </fieldset>
    )
  }

  return (
    <div>
      <label htmlFor={`campo-${campo.nombre}`} className="mb-2 block text-lg font-medium">
        {campo.etiqueta}
        {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
      </label>
      {campo.tipo === 'textarea' ? (
        <textarea
          id={`campo-${campo.nombre}`}
          rows={4}
          placeholder={campo.placeholder}
          className={CLASE_CAMPO}
          value={texto}
          onChange={(event) => onElegir(event.target.value, false)}
        />
      ) : (
        <input
          id={`campo-${campo.nombre}`}
          type={campo.tipo === 'numero' ? 'text' : 'text'}
          inputMode={campo.tipo === 'numero' ? 'numeric' : undefined}
          placeholder={campo.placeholder}
          className={CLASE_CAMPO}
          value={texto}
          onChange={(event) => onElegir(event.target.value, false)}
        />
      )}
      {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
      <Error mensaje={error} />
    </div>
  )
}

function PasoTronco({
  id,
  etiqueta,
  requerido,
  valor,
  error,
  onChange,
  onContinuar,
}: {
  id: string
  etiqueta: string
  requerido: boolean
  valor: string
  error: string | undefined
  onChange: (valor: string) => void
  onContinuar: () => void
}) {
  const rutOk = id === 'rut' && valor.length > 0 && esRutValido(valor)

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-lg font-medium">
        {etiqueta}
        {requerido ? <span className="text-(--color-rojo)"> *</span> : null}
      </label>
      <input
        id={id}
        type={id === 'email' ? 'email' : id === 'telefono' ? 'tel' : 'text'}
        inputMode={id === 'telefono' ? 'tel' : id === 'email' ? 'email' : undefined}
        autoComplete={
          id === 'email' ? 'email' : id === 'telefono' ? 'tel' : id === 'nombreContacto' ? 'name' : 'organization'
        }
        placeholder={
          id === 'rut' ? '76.482.113-0' : id === 'telefono' ? '+56 9 8123 4567' : undefined
        }
        className={CLASE_CAMPO}
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onContinuar()
          }
        }}
      />
      {id === 'rut' && valor ? (
        <p className={`mt-2 text-sm ${rutOk ? 'text-(--color-verde)' : 'text-(--color-tinta-suave)'}`}>
          {rutOk ? 'RUT válido' : 'Revisa el dígito verificador.'}
        </p>
      ) : null}
      {id === 'rut' && !valor ? (
        <p className="mt-2 text-sm text-(--color-tinta-suave)">
          Lo pedimos para que las empresas sepan que la solicitud es real.
        </p>
      ) : null}
      <Error mensaje={error} />
    </div>
  )
}
