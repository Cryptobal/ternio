'use client'

import { useMemo, useState } from 'react'

import {
  MAX_CAMPOS_MODULO,
  TIPOS_CAMPO,
  TIPOS_CAMPO_ETIQUETA,
  type CampoFormulario,
  type TipoCampo,
} from '@/lib/campos'
import {
  campoVacio,
  duplicar,
  mover,
  nombreSugerido,
  puedeAgregar,
  tipoUsaOpciones,
  tipoUsaPlaceholder,
  validarCamposConstructor,
  valorSugerido,
} from '@/lib/constructor-campos'
import { CLASE_BOTON, CLASE_CAMPO, CLASE_CHIP, CLASE_CHIP_ACTIVO, CLASE_SUPERFICIE } from '@/lib/ui'

type Props = {
  campos: CampoFormulario[]
  onChange: (campos: CampoFormulario[]) => void
  leadCount: number
  nombresOriginales: readonly string[]
  onEmpezarDeCero?: () => void
  mostrarEmpezarDeCero?: boolean
}

export function ConstructorCampos({
  campos,
  onChange,
  leadCount,
  nombresOriginales,
  onEmpezarDeCero,
  mostrarEmpezarDeCero,
}: Props) {
  const [abiertos, setAbiertos] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(campos.map((_, i) => [i, i === 0])),
  )
  const [nombreManual, setNombreManual] = useState<Record<number, boolean>>({})
  const validacion = useMemo(() => validarCamposConstructor(campos), [campos])

  function actualizar(indice: number, parche: Partial<CampoFormulario>) {
    const siguiente = campos.map((campo, i) => {
      if (i !== indice) return campo
      const mezclado = { ...campo, ...parche }
      if (
        parche.etiqueta !== undefined &&
        !nombreManual[indice] &&
        !nombresOriginales.includes(campo.nombre)
      ) {
        const otros = campos.filter((_, j) => j !== indice).map((c) => c.nombre)
        mezclado.nombre = nombreSugerido(parche.etiqueta, otros)
      }
      return mezclado
    })
    onChange(siguiente)
  }

  function cambiarNombre(indice: number, nuevo: string) {
    const actual = campos[indice]
    if (!actual) return
    if (
      leadCount > 0 &&
      nombresOriginales.includes(actual.nombre) &&
      nuevo !== actual.nombre
    ) {
      const ok = window.confirm(
        `Este rubro tiene ${leadCount} cotizaciones. Cambiar el nombre interno hará que las respuestas anteriores a este campo dejen de mostrarse con su etiqueta.`,
      )
      if (!ok) return
    }
    setNombreManual((prev) => ({ ...prev, [indice]: true }))
    actualizar(indice, { nombre: nuevo })
  }

  function agregar() {
    if (!puedeAgregar(campos)) return
    const nuevo = campoVacio(campos.map((c) => c.nombre))
    nuevo.etiqueta = 'Nueva pregunta'
    onChange([...campos, nuevo])
    setAbiertos((prev) => ({ ...prev, [campos.length]: true }))
  }

  function eliminar(indice: number) {
    onChange(campos.filter((_, i) => i !== indice))
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Preguntas del cotizador</p>
          <p className="text-sm text-(--color-tinta-suave)">
            Máximo {MAX_CAMPOS_MODULO}. El tronco (razón social, RUT, nombre, teléfono, correo) no se
            edita acá.
          </p>
        </div>
        <button
          type="button"
          className={`${CLASE_BOTON} w-auto min-w-44 px-4`}
          disabled={!puedeAgregar(campos)}
          onClick={agregar}
        >
          {puedeAgregar(campos) ? 'Agregar pregunta' : 'Máximo 6 preguntas'}
        </button>
      </div>

      {validacion.exceso ? (
        <p className="text-sm text-(--color-rojo)">
          Hay más de {MAX_CAMPOS_MODULO} preguntas. Elimina hasta quedar en {MAX_CAMPOS_MODULO} para
          poder guardar.
        </p>
      ) : null}

      {mostrarEmpezarDeCero && onEmpezarDeCero ? (
        <button
          type="button"
          className="min-h-11 justify-self-start text-sm font-medium text-(--color-rojo) underline underline-offset-4"
          onClick={onEmpezarDeCero}
        >
          Empezar de cero
        </button>
      ) : null}

      {campos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-(--color-borde) p-4 text-sm text-(--color-tinta-suave)">
          Sin preguntas del módulo: el cotizador usa solo el tronco común. Está bien si aún no
          defines el rubro.
        </p>
      ) : null}

      <ul className="grid gap-3">
        {campos.map((campo, indice) => {
          const abierto = abiertos[indice] ?? false
          const err = validacion.errores[indice] ?? {}
          return (
            <li key={`${indice}-${campo.nombre}`} className="rounded-2xl border border-(--color-borde) bg-(--color-papel)">
              <div className="flex flex-wrap items-center gap-2 p-3">
                <button
                  type="button"
                  className="min-h-11 flex-1 text-left text-sm font-medium"
                  onClick={() => setAbiertos((prev) => ({ ...prev, [indice]: !abierto }))}
                  aria-expanded={abierto}
                >
                  {campo.etiqueta || 'Sin etiqueta'} · {TIPOS_CAMPO_ETIQUETA[campo.tipo]}
                  {campo.requerido ? ' · obligatoria' : ''}
                </button>
                <div className="flex flex-wrap gap-1">
                  <BotonIcono
                    label="Subir"
                    disabled={indice === 0}
                    onClick={() => onChange(mover(campos, indice, 'arriba'))}
                  />
                  <BotonIcono
                    label="Bajar"
                    disabled={indice === campos.length - 1}
                    onClick={() => onChange(mover(campos, indice, 'abajo'))}
                  />
                  <BotonIcono
                    label="Duplicar"
                    disabled={!puedeAgregar(campos)}
                    onClick={() => onChange(duplicar(campos, indice))}
                  />
                  <BotonIcono label="Eliminar" onClick={() => eliminar(indice)} peligro />
                </div>
              </div>

              {abierto ? (
                <div className="grid gap-3 border-t border-(--color-borde) p-3 sm:p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor={`tipo-${indice}`}>
                      Tipo
                    </label>
                    <select
                      id={`tipo-${indice}`}
                      className={CLASE_CAMPO}
                      value={campo.tipo}
                      onChange={(e) => actualizar(indice, { tipo: e.target.value as TipoCampo })}
                    >
                      {TIPOS_CAMPO.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {TIPOS_CAMPO_ETIQUETA[tipo]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor={`eti-${indice}`}>
                      Etiqueta
                    </label>
                    <input
                      id={`eti-${indice}`}
                      className={CLASE_CAMPO}
                      maxLength={160}
                      value={campo.etiqueta}
                      onChange={(e) => actualizar(indice, { etiqueta: e.target.value })}
                    />
                    {err.etiqueta ? (
                      <p className="mt-1 text-sm text-(--color-rojo)">{err.etiqueta}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor={`nom-${indice}`}>
                      Nombre interno (no lo ve el cliente)
                    </label>
                    <input
                      id={`nom-${indice}`}
                      className={CLASE_CAMPO}
                      maxLength={64}
                      spellCheck={false}
                      value={campo.nombre}
                      onChange={(e) => cambiarNombre(indice, e.target.value)}
                    />
                    {err.nombre ? (
                      <p className="mt-1 text-sm text-(--color-rojo)">{err.nombre}</p>
                    ) : (
                      <p className="mt-1 text-sm text-(--color-tinta-suave)">
                        Minúsculas, números y guion bajo. Se propone solo desde la etiqueta.
                      </p>
                    )}
                  </div>

                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={campo.requerido}
                      onChange={(e) => actualizar(indice, { requerido: e.target.checked })}
                    />
                    Obligatoria
                  </label>

                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor={`ayu-${indice}`}>
                      Ayuda (opcional)
                    </label>
                    <input
                      id={`ayu-${indice}`}
                      className={CLASE_CAMPO}
                      maxLength={240}
                      value={campo.ayuda ?? ''}
                      onChange={(e) => actualizar(indice, { ayuda: e.target.value })}
                    />
                  </div>

                  {tipoUsaPlaceholder(campo.tipo) ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium" htmlFor={`ph-${indice}`}>
                        Placeholder (opcional)
                      </label>
                      <input
                        id={`ph-${indice}`}
                        className={CLASE_CAMPO}
                        maxLength={120}
                        value={campo.placeholder ?? ''}
                        onChange={(e) => actualizar(indice, { placeholder: e.target.value })}
                      />
                    </div>
                  ) : null}

                  {tipoUsaOpciones(campo.tipo) ? (
                    <EditorOpciones
                      opciones={campo.opciones ?? []}
                      error={err.opciones}
                      onChange={(opciones) => actualizar(indice, { opciones })}
                    />
                  ) : campo.tipo === 'si_no' ? (
                    <p className="text-sm text-(--color-tinta-suave)">
                      Sí / No no pide opciones: el cotizador ya usa «si» y «no».
                    </p>
                  ) : null}

                  {err.general ? (
                    <p className="text-sm text-(--color-rojo)">{err.general}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <VistaPreviaModulo campos={campos} />
    </div>
  )
}

function BotonIcono({
  label,
  onClick,
  disabled,
  peligro,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  peligro?: boolean
}) {
  return (
    <button
      type="button"
      className={`min-h-11 min-w-11 rounded-xl border border-(--color-borde) bg-white px-2 text-xs font-medium disabled:opacity-40 ${
        peligro ? 'text-(--color-rojo)' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function EditorOpciones({
  opciones,
  onChange,
  error,
}: {
  opciones: NonNullable<CampoFormulario['opciones']>
  onChange: (opciones: NonNullable<CampoFormulario['opciones']>) => void
  error?: string
}) {
  const [valorManual, setValorManual] = useState<Record<number, boolean>>({})

  function setOpcion(indice: number, parche: { valor?: string; etiqueta?: string }) {
    const siguiente = opciones.map((op, i) => {
      if (i !== indice) return op
      const mezclado = { ...op, ...parche }
      if (parche.etiqueta !== undefined && !valorManual[indice]) {
        const otros = opciones.filter((_, j) => j !== indice).map((o) => o.valor)
        mezclado.valor = valorSugerido(parche.etiqueta, otros)
      }
      return mezclado
    })
    onChange(siguiente)
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Opciones</p>
      {opciones.map((op, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-(--color-borde) bg-white p-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs" htmlFor={`op-e-${i}`}>
              Etiqueta visible
            </label>
            <input
              id={`op-e-${i}`}
              className={CLASE_CAMPO}
              value={op.etiqueta}
              onChange={(e) => setOpcion(i, { etiqueta: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" htmlFor={`op-v-${i}`}>
              Valor interno
            </label>
            <div className="flex gap-2">
              <input
                id={`op-v-${i}`}
                className={CLASE_CAMPO}
                spellCheck={false}
                value={op.valor}
                onChange={(e) => {
                  setValorManual((prev) => ({ ...prev, [i]: true }))
                  setOpcion(i, { valor: e.target.value })
                }}
              />
              <button
                type="button"
                className="min-h-11 shrink-0 px-2 text-sm text-(--color-rojo)"
                onClick={() => onChange(opciones.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="min-h-11 justify-self-start text-sm font-medium underline underline-offset-4"
        onClick={() => {
          const valor = valorSugerido('Opción', opciones.map((o) => o.valor))
          onChange([...opciones, { etiqueta: 'Opción', valor }])
        }}
      >
        Agregar opción
      </button>
      {error ? <p className="text-sm text-(--color-rojo)">{error}</p> : null}
    </div>
  )
}

/** Vista previa simplificada (un paso a la vez), sin refactor del cotizador público. */
function VistaPreviaModulo({ campos }: { campos: CampoFormulario[] }) {
  const [paso, setPaso] = useState(0)
  const [valores, setValores] = useState<Record<string, string | string[]>>({})

  if (campos.length === 0) {
    return (
      <div className={`${CLASE_SUPERFICIE} bg-(--color-papel)`}>
        <p className="text-sm font-medium">Vista previa</p>
        <p className="mt-1 text-sm text-(--color-tinta-suave)">
          Sin preguntas del módulo: el comprador verá solo el tronco común.
        </p>
      </div>
    )
  }

  const indice = Math.min(paso, campos.length - 1)
  const campo = campos[indice]
  if (!campo) return null
  const valor = valores[campo.nombre]

  return (
    <div className={`${CLASE_SUPERFICIE} bg-(--color-papel)`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Vista previa (como el comprador)</p>
        <p className="text-xs text-(--color-tinta-suave)">
          Paso {indice + 1} de {campos.length}
        </p>
      </div>

      <PreviaCampo
        campo={campo}
        valor={valor}
        onChange={(v) => setValores((prev) => ({ ...prev, [campo.nombre]: v }))}
      />

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="min-h-11 flex-1 rounded-2xl border border-(--color-borde) bg-white text-sm font-medium disabled:opacity-40"
          disabled={indice === 0}
          onClick={() => setPaso(indice - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="min-h-11 flex-1 rounded-2xl border border-(--color-borde) bg-white text-sm font-medium disabled:opacity-40"
          disabled={indice >= campos.length - 1}
          onClick={() => setPaso(indice + 1)}
        >
          Siguiente
        </button>
      </div>
      <p className="mt-2 text-xs text-(--color-tinta-suave)">
        Vista previa del módulo. El tronco y el envío no se muestran acá.
      </p>
    </div>
  )
}

function PreviaCampo({
  campo,
  valor,
  onChange,
}: {
  campo: CampoFormulario
  valor: string | string[] | undefined
  onChange: (v: string | string[]) => void
}) {
  const texto = Array.isArray(valor) ? valor.join(',') : (valor ?? '')
  const multiples = Array.isArray(valor)
    ? valor
    : texto
      ? texto.split(',').filter(Boolean)
      : []

  if (campo.tipo === 'si_no') {
    return (
      <fieldset>
        <legend className="text-lg font-medium">
          {campo.etiqueta || 'Sin etiqueta'}
          {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
        </legend>
        <div className="mt-3 grid gap-2">
          {[
            { valor: 'si', etiqueta: 'Sí' },
            { valor: 'no', etiqueta: 'No' },
          ].map((op) => (
            <button
              key={op.valor}
              type="button"
              className={`${CLASE_CHIP} ${texto === op.valor ? CLASE_CHIP_ACTIVO : ''}`}
              onClick={() => onChange(op.valor)}
            >
              {op.etiqueta}
            </button>
          ))}
        </div>
        {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
      </fieldset>
    )
  }

  if (campo.tipo === 'select' || campo.tipo === 'radio') {
    return (
      <fieldset>
        <legend className="text-lg font-medium">
          {campo.etiqueta || 'Sin etiqueta'}
          {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
        </legend>
        <div className="mt-3 grid gap-2">
          {(campo.opciones ?? []).map((op) => (
            <button
              key={op.valor}
              type="button"
              className={`${CLASE_CHIP} ${texto === op.valor ? CLASE_CHIP_ACTIVO : ''}`}
              onClick={() => onChange(op.valor)}
            >
              {op.etiqueta || op.valor}
            </button>
          ))}
        </div>
        {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
      </fieldset>
    )
  }

  if (campo.tipo === 'opcion_multiple') {
    return (
      <fieldset>
        <legend className="text-lg font-medium">
          {campo.etiqueta || 'Sin etiqueta'}
          {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
        </legend>
        <div className="mt-3 grid gap-2">
          {(campo.opciones ?? []).map((op) => {
            const activo = multiples.includes(op.valor)
            return (
              <button
                key={op.valor}
                type="button"
                className={`${CLASE_CHIP} ${activo ? CLASE_CHIP_ACTIVO : ''}`}
                onClick={() => {
                  onChange(
                    activo
                      ? multiples.filter((item) => item !== op.valor)
                      : [...multiples, op.valor],
                  )
                }}
              >
                {op.etiqueta || op.valor}
              </button>
            )
          })}
        </div>
        {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
      </fieldset>
    )
  }

  return (
    <div>
      <label className="mb-2 block text-lg font-medium" htmlFor={`prev-${campo.nombre}`}>
        {campo.etiqueta || 'Sin etiqueta'}
        {campo.requerido ? <span className="text-(--color-rojo)"> *</span> : null}
      </label>
      {campo.tipo === 'textarea' ? (
        <textarea
          id={`prev-${campo.nombre}`}
          rows={4}
          className={CLASE_CAMPO}
          placeholder={campo.placeholder}
          value={texto}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={`prev-${campo.nombre}`}
          className={CLASE_CAMPO}
          inputMode={campo.tipo === 'numero' ? 'numeric' : undefined}
          placeholder={campo.placeholder}
          value={texto}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {campo.ayuda ? <p className="mt-2 text-sm text-(--color-tinta-suave)">{campo.ayuda}</p> : null}
    </div>
  )
}
