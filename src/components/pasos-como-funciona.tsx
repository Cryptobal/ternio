import { pasosComoFunciona } from '@/lib/copy-flujo'

export function PasosComoFunciona({
  comuna,
  listaEspera = false,
}: {
  comuna?: string
  listaEspera?: boolean
}) {
  const pasos = pasosComoFunciona({ comuna, listaEspera })

  return (
    <ol className="mt-4 grid gap-4">
      {pasos.map((paso) => (
        <li key={paso.titulo}>
          <h3 className="font-medium">{paso.titulo}</h3>
          <p className="mt-1 text-sm text-(--color-texto-suave)">{paso.texto}</p>
        </li>
      ))}
    </ol>
  )
}
