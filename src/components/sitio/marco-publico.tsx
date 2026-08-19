import Link from 'next/link'

import { Isotipo } from '@/components/marca/logo'
import { NavPublica } from '@/components/sitio/nav-publica'
import { combinacionesPublicadas, comunasActivas, rubrosConComunas } from '@/lib/catalogo'
import { combosDestacados, enlacesCatalogo } from '@/lib/contenido-home'

export { NavPublica as CabeceraPublica }

export async function PiePublico() {
  let filas: Awaited<ReturnType<typeof rubrosConComunas>> = []
  let comunas: Awaited<ReturnType<typeof comunasActivas>> = []
  let combinaciones: Awaited<ReturnType<typeof combinacionesPublicadas>> = []
  try {
    ;[filas, comunas, combinaciones] = await Promise.all([
      rubrosConComunas(),
      comunasActivas(),
      combinacionesPublicadas(),
    ])
  } catch {
    /* Pie vacío si la base no responde: mejor que tumbar la página. */
  }

  const servicios = enlacesCatalogo(
    filas.map((r) => ({ slug: r.slug, nombre: r.nombre, audiencias: r.audiencias })),
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
    <footer className="border-t border-(--color-linea) bg-(--color-superficie)">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <Isotipo variante="claro" className="size-7 shrink-0" />
            <div>
              <p className="font-medium text-(--color-texto)">ternio.cl</p>
              <p className="mt-1 text-xs text-(--color-texto-suave)">
                Cotiza servicios para tu casa o tu empresa.
              </p>
            </div>
          </div>

          {servicios.length > 0 ? (
            <div>
              <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Servicios</p>
              <ul className="mt-3 space-y-2 text-sm">
                {servicios.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={item.href!}
                      className="text-(--color-texto) underline-offset-4 hover:underline"
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
              <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">
                Cotiza en tu comuna
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {combos.map((combo) => (
                  <li key={combo.href}>
                    <Link
                      href={combo.href}
                      className="text-(--color-texto) underline-offset-4 hover:underline"
                    >
                      {combo.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Ternio</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/como-funciona"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/precios"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="/proveedores"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Soy proveedor
                </Link>
              </li>
              <li>
                <Link
                  href="/entrar"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Términos
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-(--color-texto) underline-offset-4 hover:underline"
                >
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs text-(--color-texto-suave)">
          Tratamos tus datos conforme a la Ley 21.719.
        </p>
      </div>
    </footer>
  )
}

export function MarcoPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-fondo) text-(--color-texto)">
      <NavPublica />
      <main className="flex-1">{children}</main>
      <PiePublico />
    </div>
  )
}
