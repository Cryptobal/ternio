import { ModoRubro, PrismaClient, RolUsuario } from '@prisma/client'

import { COMUNAS, REGION, RUBROS } from './catalogo-inicial'
import { validarModoRubro } from '../src/lib/rubros'

/**
 * Seed idempotente (upsert en todo). Se puede correr las veces que sea.
 *
 * Deja el catálogo de lanzamiento: 3 rubros en VENTA (con precios) y 5 en
 * CAPTURA (sin precios, solo SEO + lista de espera), las comunas piloto de la
 * Región Metropolitana y la cuenta de admin tomada desde el entorno.
 */

const prisma = new PrismaClient()


async function main(): Promise<void> {
  for (const rubro of RUBROS) {
    // Un rubro en VENTA sin ambos precios sería un lead vendible a $0.
    const validacion = validarModoRubro({ ...rubro, activo: true })
    if (!validacion.ok) {
      throw new Error(`Rubro "${rubro.slug}" inválido: ${validacion.motivo}`)
    }

    const datos = {
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
    }

    await prisma.rubro.upsert({
      where: { slug: rubro.slug },
      create: { slug: rubro.slug, ...datos },
      update: datos,
    })
  }

  for (const comuna of COMUNAS) {
    const datos = { nombre: comuna.nombre, region: REGION, activa: true, orden: comuna.orden }
    await prisma.comuna.upsert({
      where: { slug: comuna.slug },
      create: { slug: comuna.slug, ...datos },
      update: datos,
    })
  }

  // Publica todas las combinaciones rubro × comuna piloto.
  const rubrosDb = await prisma.rubro.findMany({ select: { id: true, slug: true } })
  const comunasDb = await prisma.comuna.findMany({ select: { id: true, slug: true } })

  for (const rubro of rubrosDb) {
    for (const comuna of comunasDb) {
      await prisma.rubroComuna.upsert({
        where: { rubroId_comunaId: { rubroId: rubro.id, comunaId: comuna.id } },
        create: { rubroId: rubro.id, comunaId: comuna.id, activa: true },
        update: { activa: true },
      })
    }
  }

  await sembrarAdmin()

  const ventas = await prisma.rubro.count({ where: { modo: ModoRubro.VENTA } })
  const capturas = await prisma.rubro.count({ where: { modo: ModoRubro.CAPTURA } })
  const combinaciones = await prisma.rubroComuna.count()

  console.log(
    `Seed listo: ${ventas} rubros en VENTA, ${capturas} en CAPTURA, ` +
      `${comunasDb.length} comunas, ${combinaciones} páginas {rubro}/{comuna}.`,
  )
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
