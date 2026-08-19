import { vistaTraficoGa4, type TraficoGa4 } from '@/lib/ga4'

export function BloqueTraficoGa4({ trafico }: { trafico: TraficoGa4 }) {
  const vista = vistaTraficoGa4(trafico)

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Tráfico GA4</h2>
      <p className="mt-1 text-sm text-(--color-tinta-suave)">{vista.mensaje}</p>

      {!vista.conectado ? null : (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {vista.cortes.map((corte) => (
            <div
              key={corte.titulo}
              className="rounded-3xl border border-(--color-borde) bg-white p-4 shadow-[0_12px_32px_-20px_rgb(14_27_44/0.18)]"
            >
              <p className="text-sm font-medium">{corte.titulo}</p>
              <p className="mt-0.5 text-xs text-(--color-tinta-suave)">{corte.rango}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-(--color-tinta-suave)">Sesiones</dt>
                  <dd className="font-display text-2xl tabular-nums">{corte.sesiones}</dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-tinta-suave)">Usuarios</dt>
                  <dd className="font-display text-2xl tabular-nums">{corte.usuarios}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs font-medium text-(--color-tinta-suave)">
                Landing paths
              </p>
              {corte.landings.length === 0 ? (
                <p className="mt-1 text-sm text-(--color-tinta-suave)">
                  Sin landings en este corte.
                </p>
              ) : (
                <ul className="mt-1 grid gap-1 text-sm">
                  {corte.landings.map((fila) => (
                    <li key={fila.path} className="flex justify-between gap-3">
                      <span className="truncate">{fila.path}</span>
                      <span className="tabular-nums text-(--color-tinta-suave)">
                        {fila.sesiones}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
