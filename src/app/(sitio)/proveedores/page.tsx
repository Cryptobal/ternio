import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FormularioCuentaProveedor } from '@/components/formulario-cuenta-proveedor'
import { comunasActivas, rubrosActivos } from '@/lib/catalogo'
import { ROLES } from '@/lib/roles'
import { sesionActual } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Crea tu cuenta de proveedor',
  description:
    'Crea tu cuenta de proveedor en Ternio. Confirmas el celular y dejas tu cobertura. Aún no hay marketplace.',
  alternates: { canonical: '/proveedores' },
}

export const dynamic = 'force-dynamic'

const CORREO = process.env.NEXT_PUBLIC_CONTACTO_PROVEEDORES

export default async function Proveedores() {
  const sesion = await sesionActual()
  if (sesion?.user?.rol === ROLES.PROVEEDOR) redirect('/panel')

  const [rubros, comunas] = await Promise.all([rubrosActivos(), comunasActivas()])

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-eyebrow text-[0.7rem] text-(--color-tinta-suave)">Para empresas</p>
      <h1 className="font-display mt-3 text-4xl leading-tight">Crea tu cuenta de proveedor</h1>
      <p className="mt-4 text-lg text-(--color-tinta-suave)">
        Dejas los datos de tu empresa, eliges cobertura y confirmas el celular. El marketplace
        todavía no está abierto: cuando se abra, te avisamos.
      </p>

      <div className="mt-10" id="crear-cuenta">
        {rubros.length === 0 ? (
          <p className="rounded-2xl border border-(--color-borde) bg-white p-5 text-(--color-tinta-suave)">
            Aún no podemos crear cuentas: falta el catálogo de rubros. Vuelve en un rato.
          </p>
        ) : (
          <FormularioCuentaProveedor
            rubros={rubros.map((rubro) => ({ slug: rubro.slug, nombre: rubro.nombre }))}
            comunas={comunas}
          />
        )}
      </div>

      <p className="mt-6 text-sm text-(--color-tinta-suave)">
        ¿Ya tienes cuenta?{' '}
        <Link href="/entrar" className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
          Entra con tu celular
        </Link>
        .
      </p>

      {CORREO ? (
        <p className="mt-4 text-sm text-(--color-tinta-suave)">
          Si prefieres, escríbenos a{' '}
          <a href={`mailto:${CORREO}`} className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
            {CORREO}
          </a>
          .
        </p>
      ) : null}

      <p className="mt-8 text-sm text-(--color-tinta-suave)">
        ¿Necesitas un servicio para tu empresa?{' '}
        <Link href="/" className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
          Cotiza gratis
        </Link>
        .
      </p>
    </article>
  )
}
