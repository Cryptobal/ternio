import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <p className="mt-3 text-(--color-tinta-suave)">
        Puede que el enlace esté malo o que la página ya no exista.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-(--color-marca) px-5 py-3 text-white"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
