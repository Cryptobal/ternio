import type { PreguntaFaq } from '@/lib/seo-contenido'

export function FaqRubro({ items }: { items: readonly PreguntaFaq[] }) {
  if (items.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl">Preguntas frecuentes</h2>
      <dl className="mt-4 space-y-5">
        {items.map((item) => (
          <div key={item.pregunta}>
            <dt className="font-medium">{item.pregunta}</dt>
            <dd className="mt-1 text-(--color-texto-suave)">{item.respuesta}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
