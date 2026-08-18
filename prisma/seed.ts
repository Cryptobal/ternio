import { ModoRubro, PrismaClient, RolUsuario } from '@prisma/client'

import { ensureGardSecurity } from '../src/lib/gard'
import { COMUNAS, COMUNAS_SEO, RUBROS } from './catalogo-inicial'
import { validarModoRubro } from '../src/lib/rubros'

/**
 * Seed idempotente y seguro de re-ejecutar.
 *
 * - Rubros: crea si faltan; no pisa copy ni precios editados en admin.
 * - Comunas: upsert de las 346 del CUT (región + provincia).
 * - RubroComuna: crea solo las combinaciones piloto (COMUNAS_SEO).
 *   No activa ni crea páginas para el resto de Chile.
 * - Admin: upsert desde el entorno, igual que antes.
 * - Gard: `ensureGardSecurity` (nacional + seguridad + pack si saldo 0).
 */

const prisma = new PrismaClient()

async function main(): Promise<void> {
  await sembrarRubros()
  await sembrarComunas()
  await sembrarPaginasSeo()
  await sembrarAdmin()
  const gard = await ensureGardSecurity(prisma)
  console.log(`Gard listo (${gard.slug}${gard.creado ? ', creado' : ''}).`)

  const ventas = await prisma.rubro.count({ where: { modo: ModoRubro.VENTA } })
  const capturas = await prisma.rubro.count({ where: { modo: ModoRubro.CAPTURA } })
  const comunas = await prisma.comuna.count()
  const combinaciones = await prisma.rubroComuna.count({ where: { activa: true } })

  console.log(
    `Seed listo: ${ventas} rubros en VENTA, ${capturas} en CAPTURA, ` +
      `${comunas} comunas, ${combinaciones} páginas {rubro}/{comuna} activas ` +
      `(solo el piloto SEO).`,
  )
}

async function sembrarRubros(): Promise<void> {
  for (const rubro of RUBROS) {
    const validacion = validarModoRubro({ ...rubro, activo: true })
    if (!validacion.ok) {
      throw new Error(`Rubro "${rubro.slug}" inválido: ${validacion.motivo}`)
    }

    const existe = await prisma.rubro.findUnique({
      where: { slug: rubro.slug },
      select: { id: true },
    })
    if (existe) continue

    await prisma.rubro.create({
      data: {
        slug: rubro.slug,
        nombre: rubro.nombre,
        nombrePlural: rubro.nombrePlural,
        descripcion: rubro.descripcion,
        modo: rubro.modo,
        activo: true,
        orden: rubro.orden,
        precioExclusivoClp: rubro.precioExclusivoClp,
        precioCompartidoClp: rubro.precioCompartidoClp,
        camposFormulario: rubro.campos,
        contenidoSeo: rubro.contenidoSeo,
      },
    })
  }
}

async function sembrarComunas(): Promise<void> {
  for (const [indice, comuna] of COMUNAS.entries()) {
    const datos = {
      nombre: comuna.nombre,
      region: comuna.region,
      provincia: comuna.provincia,
      activa: true,
      orden: indice + 1,
    }
    await prisma.comuna.upsert({
      where: { slug: comuna.slug },
      create: { slug: comuna.slug, ...datos },
      update: datos,
    })
  }
}

async function sembrarPaginasSeo(): Promise<void> {
  const rubrosDb = await prisma.rubro.findMany({ select: { id: true, slug: true } })
  const comunasDb = await prisma.comuna.findMany({
    where: { slug: { in: [...COMUNAS_SEO] } },
    select: { id: true, slug: true },
  })

  if (comunasDb.length !== COMUNAS_SEO.length) {
    const faltan = COMUNAS_SEO.filter((slug) => !comunasDb.some((fila) => fila.slug === slug))
    throw new Error(`Faltan comunas SEO en el seed: ${faltan.join(', ')}`)
  }

  for (const rubro of rubrosDb) {
    for (const comuna of comunasDb) {
      await prisma.rubroComuna.upsert({
        where: { rubroId_comunaId: { rubroId: rubro.id, comunaId: comuna.id } },
        create: { rubroId: rubro.id, comunaId: comuna.id, activa: true },
        update: {},
      })
    }
  }
}

/**
 * La cuenta de admin se toma del entorno. Sin ADMIN_EMAIL/ADMIN_PASSWORD_HASH
 * el seed no falla: simplemente no hay panel hasta que se configuren.
 */
async function sembrarAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim()

  if (!email || !passwordHash) {
    console.warn(
      'Sin ADMIN_EMAIL/ADMIN_PASSWORD_HASH: no se creó la cuenta de admin. ' +
        'Genera el hash con "pnpm hash:password" y vuelve a correr el seed.',
    )
    return
  }

  await prisma.user.upsert({
    where: { email },
    create: { email, name: 'Admin', rol: RolUsuario.ADMIN, passwordHash },
    update: { rol: RolUsuario.ADMIN, passwordHash },
  })

  console.log(`Cuenta de admin lista para ${email}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
