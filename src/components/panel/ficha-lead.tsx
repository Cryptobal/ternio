import { formatearClp, textoAntiguedad } from '@/lib/dinero'
import { etiquetasVerificacion } from '@/lib/ficha-anonima'
import { CUPOS_COMPARTIDO, tramoFreshness } from '@/lib/matching'
import { CLASE_SUPERFICIE } from '@/lib/ui'

export type DatosFichaLead = {
  rubro: string
  comuna: string
  region: string
  verificadoAt: Date
  rutValido: boolean
  telefonoVerificado: boolean
  cuposRestantes: number
  precioExclusivo: number | null
  precioCompartido: number | null
  precioBaseExclusivo: number | null
  precioBaseCompartido: number | null
  reservadoGard?: boolean
  disponibleEnMin?: number
}

const fmtProximo = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function leyendaFreshness(factor: number | null, proximo: Date | null): string | null {
  if (factor === null || !proximo) return null
  const pct = Math.round(factor * 100)
  if (factor === 1) {
    return `Precio de hoy: 100% del base · pasa a 80% el ${fmtProximo.format(proximo)}`
  }
  if (factor === 0.8) {
    return `Precio de hoy: ${pct}% del base · pasa a 50% el ${fmtProximo.format(proximo)}`
  }
  return `Precio de hoy: ${pct}% del base · se archiva el ${fmtProximo.format(proximo)}`
}

function PrecioConBase({
  vigente,
  base,
  etiqueta,
}: {
  vigente: number | null
  base: number | null
  etiqueta: string
}) {
  if (!vigente) return null
  const hayDescuento = base != null && base > vigente
  return (
    <div>
      <p className="text-xs text-(--color-tinta-suave)">{etiqueta}</p>
      <p className="font-display text-2xl leading-tight">
        {formatearClp(vigente)}
        {hayDescuento ? (
          <span className="ml-2 text-base font-normal text-(--color-tinta-suave) line-through">
            {formatearClp(base)}
          </span>
        ) : null}
      </p>
    </div>
  )
}

export function FichaLead({
  lead,
  ejemplo = false,
  children,
  ahora,
}: {
  lead: DatosFichaLead
  ejemplo?: boolean
  children?: React.ReactNode
  ahora?: Date
}) {
  const momento = ahora ?? new Date()
  const tramo = tramoFreshness(lead.verificadoAt, momento)
  const cuposTomados = CUPOS_COMPARTIDO - lead.cuposRestantes
  const cerrada =
    lead.cuposRestantes <= 0 ||
    (lead.precioExclusivo == null && lead.precioCompartido == null) ||
    tramo.factor === null
  const leyenda = leyendaFreshness(tramo.factor, tramo.proximoCambioAt)
  const badges = etiquetasVerificacion(lead)

  return (
    <article className={`${CLASE_SUPERFICIE} relative`}>
      {ejemplo ? (
        <p className="absolute right-4 top-4 rounded-full border border-(--color-borde) bg-(--color-papel) px-2.5 py-0.5 text-xs font-medium text-(--color-tinta-suave)">
          Ejemplo
        </p>
      ) : null}

      <p className="font-medium">
        {lead.rubro} · {lead.comuna}
      </p>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">
        {lead.region} · {textoAntiguedad(lead.verificadoAt, momento)}
      </p>

      {badges.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-(--color-verde)/30 bg-(--color-verde-suave) px-2.5 py-0.5 text-xs font-medium text-(--color-verde)"
            >
              {badge}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <p className="text-xs text-(--color-tinta-suave)">
          Cupos compartidos · quedan {lead.cuposRestantes} de {CUPOS_COMPARTIDO}
        </p>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {Array.from({ length: CUPOS_COMPARTIDO }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < cuposTomados ? 'bg-(--color-marca)' : 'bg-(--color-borde)'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-(--color-tinta-suave)">Precio según antigüedad</p>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${
                tramo.factor !== null && i <= tramo.tramo
                  ? 'bg-(--color-tinta)'
                  : 'bg-(--color-borde)'
              }`}
            />
          ))}
        </div>
        {leyenda ? <p className="mt-2 text-xs text-(--color-tinta-suave)">{leyenda}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PrecioConBase
          etiqueta="Compartido"
          vigente={lead.precioCompartido}
          base={lead.precioBaseCompartido}
        />
        <PrecioConBase
          etiqueta="Exclusivo"
          vigente={lead.precioExclusivo}
          base={lead.precioBaseExclusivo}
        />
      </div>

      {cerrada ? (
        <p className="mt-4 rounded-2xl border border-(--color-borde) bg-(--color-papel) px-4 py-3 text-sm text-(--color-tinta-suave)">
          {tramo.factor === null
            ? 'Solicitud archivada: ya pasó la ventana de 7 días.'
            : 'Solicitud cerrada: los 3 cupos ya fueron tomados.'}
        </p>
      ) : (
        children
      )}
    </article>
  )
}
