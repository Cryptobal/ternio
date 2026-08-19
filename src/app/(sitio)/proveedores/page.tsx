import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FormularioCuentaProveedor } from '@/components/formulario-cuenta-proveedor'
import { FichaLead } from '@/components/panel/ficha-lead'
import { comunasActivas, rubrosActivos } from '@/lib/catalogo'
import { origenAltaDesdeQuery } from '@/lib/origen-alta'
import { CREDITOS_ALTA } from '@/lib/creditos'
import { formatearClp } from '@/lib/dinero'
import { precioVigente } from '@/lib/matching'
import { ROLES } from '@/lib/roles'
import { CLASE_SUPERFICIE } from '@/lib/ui'
import { sesionActual } from '@/server/sesion'

export const metadata: Metadata = {
  title: 'Para empresas de servicios',
  description:
    'Clientes que ya te buscan. Pagas solo el contacto. Pack de arranque al confirmar el celular.',
  alternates: { canonical: '/proveedores' },
}

export const dynamic = 'force-dynamic'

const CORREO = process.env.NEXT_PUBLIC_CONTACTO_PROVEEDORES

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Proveedores({ searchParams }: Props) {
  const origenAlta = origenAltaDesdeQuery(await searchParams)
  const sesion = await sesionActual()
  if (sesion?.user?.rol === ROLES.PROVEEDOR) redirect('/panel')

  const [rubros, comunas] = await Promise.all([rubrosActivos(), comunasActivas()])
  const rubrosVenta = rubros.filter(
    (rubro) =>
      rubro.modo === 'VENTA' &&
      (rubro.precioCompartidoClp ?? 0) > 0 &&
      (rubro.precioExclusivoClp ?? 0) > 0,
  )

  const ahora = new Date()
  const ejemploVerificadoAt = new Date(ahora.getTime() - 30 * 60 * 60 * 1000)
  const baseCompartido = 20_000
  const baseExclusivo = 50_000
  const fichaEjemplo = {
    rubro: 'Seguridad privada',
    comuna: 'Las Condes',
    region: 'Región Metropolitana',
    verificadoAt: ejemploVerificadoAt,
    rutValido: true,
    telefonoVerificado: true,
    cuposRestantes: 2,
    precioBaseCompartido: baseCompartido,
    precioBaseExclusivo: baseExclusivo,
    precioCompartido: precioVigente(baseCompartido, ejemploVerificadoAt, ahora),
    precioExclusivo: precioVigente(baseExclusivo, ejemploVerificadoAt, ahora),
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-eyebrow text-[0.7rem] text-(--color-texto-suave)">Para empresas de servicios</p>
      <h1 className="font-display mt-3 text-4xl leading-tight">
        Clientes que ya te buscan. Pagas solo el contacto.
      </h1>
      <p className="mt-4 text-lg text-(--color-texto-suave)">
        Ves la ficha anónima, eliges compartido o exclusivo, y al pagar se revela el teléfono.
        Sin suscripción: solo créditos.
      </p>
      <a
        href="#crear-cuenta"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-(--color-marca) px-5 py-3 font-semibold text-white"
      >
        Crear cuenta de proveedor
      </a>

      <section className="mt-12 rounded-3xl border border-(--color-borde) bg-(--color-superficie) p-5 sm:p-6">
        <h2 className="font-display text-2xl">Precios por contacto</h2>
        <p className="mt-2 text-sm text-(--color-texto-suave)">
          {rubrosVenta.length > 0
            ? 'Compartido o exclusivo, con descuento según la frescura del lead.'
            : 'Cuando abramos servicios a la venta, los precios viven en una sola página.'}
        </p>
        <Link
          href="/precios"
          className="mt-4 inline-flex min-h-12 items-center font-semibold text-(--color-marca) underline-offset-4 hover:underline"
        >
          Ver precios
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Así se ve un comprador</h2>
        <p className="mt-2 text-sm text-(--color-texto-suave)">
          Ficha anónima hasta que pagas. Este módulo es ilustrativo.
        </p>
        <div className="mt-4">
          <FichaLead lead={fichaEjemplo} ejemplo ahora={ahora} />
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Garantia
          titulo="Aviso al instante"
          texto="Cuando un comprador queda verificado, te llega un correo si calza con tu cobertura."
        />
        <Garantia
          titulo="Precio que baja"
          texto="100% las primeras 24 h, 80% hasta 72 h, 50% hasta 7 días; después se archiva."
        />
        <Garantia
          titulo={`${formatearClp(CREDITOS_ALTA)} de arranque`}
          texto="Al confirmar el celular te acreditamos el pack de arranque. Sin tarjeta."
        />
      </section>

      <div className="mt-14" id="crear-cuenta">
        <h2 className="font-display text-2xl">Crea tu cuenta de proveedor</h2>
        <p className="mt-2 text-(--color-texto-suave)">
          Dejas los datos de tu empresa, eliges cobertura y confirmas el celular con un código
          OTP. Después de eso puedes tomar contactos.
        </p>
        <div className="mt-6">
          {rubros.length === 0 ? (
            <p className="rounded-2xl border border-(--color-borde) bg-(--color-superficie) p-5 text-(--color-texto-suave)">
              Aún no podemos crear cuentas: falta el catálogo de rubros. Vuelve en un rato.
            </p>
          ) : (
            <FormularioCuentaProveedor
              rubros={rubros.map((rubro) => ({
                slug: rubro.slug,
                nombre: rubro.nombre,
                audiencias: rubro.audiencias,
              }))}
              comunas={comunas}
              origenAlta={origenAlta}
            />
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-(--color-texto-suave)">
        ¿Ya tienes cuenta?{' '}
        <Link href="/entrar" className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
          Entra con tu celular
        </Link>
        .
      </p>

      {CORREO ? (
        <p className="mt-4 text-sm text-(--color-texto-suave)">
          Si prefieres, escríbenos a{' '}
          <a href={`mailto:${CORREO}`} className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
            {CORREO}
          </a>
          .
        </p>
      ) : null}

      <p className="mt-8 text-sm text-(--color-texto-suave)">
        ¿Necesitas un servicio para tu empresa?{' '}
        <Link href="/" className="font-medium text-(--color-marca) underline-offset-4 hover:underline">
          Cotiza gratis
        </Link>
        .
      </p>
    </article>
  )
}

function Garantia({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className={CLASE_SUPERFICIE}>
      <h3 className="font-display text-lg">{titulo}</h3>
      <p className="mt-2 text-sm text-(--color-texto-suave)">{texto}</p>
    </div>
  )
}
