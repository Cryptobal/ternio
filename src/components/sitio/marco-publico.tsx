import Link from 'next/link'

import { Isotipo, Logo } from '@/components/marca/logo'
import { combinacionesPublicadas, comunasActivas, rubrosConComunas } from '@/lib/catalogo'
import { combosDestacados, enlacesCatalogo } from '@/lib/contenido-home'

export function CabeceraPublica() {
  return (
    <header className="sticky top-0 z-20 bg-(--color-tinta)/95 text-white backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Ternio, ir al inicio">
          <Logo variante="oscuro" />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-white/90 underline-offset-4 transition hover:text-white hover:underline"
          >
            Ya coticé
          </Link>
          <Link
            href="/proveedores"
            className="inline-flex min-h-11 items-center rounded-full border border-(--color-ambar) px-4 py-2 text-sm font-semibold text-(--color-ambar) transition hover:bg-(--color-ambar) hover:text-(--color-tinta)"
          >
            Soy proveedor
          </Link>
        </div>
      </div>
    </header>
  )
}

export async function PiePublico() {
  const [filas, comunas, combinaciones] = await Promise.all([
    rubrosConComunas(),
    comunasActivas(),
    combinacionesPublicadas(),
  ])

  const servicios = enlacesCatalogo(
    filas.map((r) => ({ slug: r.slug, nombre: r.nombre })),
    combinaciones,
  )
    .flatMap((g) => g.items)
    .filter((item) => item.href)
    .filter((item, i, arr) => arr.findIndex((x) => x.slug === item.slug) === i)
    .slice(0, 6)

  const nombreRubro = new Map(filas.map((r) => [r.slug, r.nombre]))
  const nombreComuna = new Map(comunas.map((c) => [c.slug, c.nombre]))
  const combos = combosDestacados(
    combinaciones.flatMap((fila) => {
      const rubroNombre = nombreRubro.get(fila.rubro)
      const comunaNombre = nombreComuna.get(fila.comuna)
      if (!rubroNombre || !comunaNombre) return []
      return [
        {
          rubroSlug: fila.rubro,
          comunaSlug: fila.comuna,
          rubroNombre,
          comunaNombre,
        },
      ]
    }),
    4,
  )

  return (
    <footer className="border-t border-(--color-linea) bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <Isotipo variante="claro" className="size-7 shrink-0" />
            <div>
              <p className="font-medium text-(--color-tinta)">ternio.cl</p>
              <p className="mt-1 text-xs text-(--color-tinta-suave)">
                Cotiza servicios para tu casa o tu empresa.
              </p>
            </div>
          </div>

          {servicios.length > 0 ? (
            <div>
              <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">Servicios</p>
              <ul className="mt-3 space-y-2 text-sm">
                {servicios.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={item.href!}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {combos.length > 0 ? (
            <div>
              <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">
                Cotiza en tu comuna
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {combos.map((combo) => (
                  <li key={combo.href}>
                    <Link href={combo.href} className="underline-offset-4 hover:underline">
                      {combo.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">Ternio</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/proveedores" className="underline-offset-4 hover:underline">
                  Soy proveedor
                </Link>
              </li>
              <li>
                <Link href="/entrar" className="underline-offset-4 hover:underline">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="underline-offset-4 hover:underline">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="underline-offset-4 hover:underline">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/blog" className="underline-offset-4 hover:underline">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs text-(--color-tinta-suave)">
          Tratamos tus datos conforme a la Ley 21.719.
        </p>
      </div>
    </footer>
  )
}

export function MarcoPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraPublica />
      <main className="flex-1">{children}</main>
      <PiePublico />
    </div>
  )
}
