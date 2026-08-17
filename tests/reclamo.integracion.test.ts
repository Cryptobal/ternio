import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EstadoLead, ModoRubro, PrismaClient, RolUsuario } from '@prisma/client'

import { emitirClaimToken, verificarClaimToken } from '@/lib/claim-token'
import { reclamarLeadsPorHash } from '@/lib/reclamo'

/**
 * Prueba de integración del reclamo de leads.
 *
 * Necesita una base PostgreSQL con las migraciones aplicadas. Se corre así:
 *
 *   TEST_DATABASE_URL="postgresql://…" pnpm test
 *
 * Sin esa variable el bloque se salta, para que `pnpm test` siga siendo
 * ejecutable en un entorno sin base de datos.
 */
const urlPruebas = process.env.TEST_DATABASE_URL

describe.skipIf(!urlPruebas)('reclamo de leads contra la base de datos', () => {
  const prisma = new PrismaClient({ datasources: { db: { url: urlPruebas ?? '' } } })
  const sufijo = `test-reclamo-${process.pid}`

  let rubroId = ''
  let comunaId = ''
  let usuarioId = ''
  let otroUsuarioId = ''

  beforeAll(async () => {
    process.env.AUTH_SECRET = 'secreto-de-pruebas-solamente'

    const rubro = await prisma.rubro.create({
      data: { slug: `rubro-${sufijo}`, nombre: 'Rubro de prueba', modo: ModoRubro.VENTA,
        precioExclusivoClp: 1000, precioCompartidoClp: 500 },
    })
    const comuna = await prisma.comuna.create({
      data: { slug: `comuna-${sufijo}`, nombre: 'Comuna de prueba', region: 'RM' },
    })
    const usuario = await prisma.user.create({
      data: { email: `comprador-${sufijo}@ejemplo.cl`, rol: RolUsuario.COMPRADOR },
    })
    const otro = await prisma.user.create({
      data: { email: `otro-${sufijo}@ejemplo.cl`, rol: RolUsuario.COMPRADOR },
    })

    rubroId = rubro.id
    comunaId = comuna.id
    usuarioId = usuario.id
    otroUsuarioId = otro.id
  })

  afterAll(async () => {
    await prisma.lead.deleteMany({ where: { rubroId } })
    await prisma.user.deleteMany({ where: { id: { in: [usuarioId, otroUsuarioId] } } })
    await prisma.rubro.deleteMany({ where: { id: rubroId } })
    await prisma.comuna.deleteMany({ where: { id: comunaId } })
    await prisma.$disconnect()
  })

  async function crearLead(claimTokenHash: string | null) {
    return prisma.lead.create({
      data: {
        rubroId,
        comunaId,
        estado: EstadoLead.RECIBIDO,
        modoRubroAlCrear: ModoRubro.VENTA,
        rutValido: true,
        claimTokenHash,
      },
      select: { id: true },
    })
  }

  it('caso feliz: la cuenta se lleva los leads creados con ese token', async () => {
    const token = emitirClaimToken()
    const uno = await crearLead(token.hash)
    const otro = await crearLead(token.hash)

    const reclamados = await reclamarLeadsPorHash(prisma, token.hash, usuarioId)

    expect(reclamados.map((lead) => lead.id).sort()).toEqual([uno.id, otro.id].sort())

    const enBase = await prisma.lead.findMany({
      where: { id: { in: [uno.id, otro.id] } },
      select: { compradorUsuarioId: true },
    })
    expect(enBase.every((lead) => lead.compradorUsuarioId === usuarioId)).toBe(true)

    // Queda el asiento en el historial.
    const transiciones = await prisma.transicionLead.findMany({
      where: { leadId: uno.id, tipo: 'CUENTA_VINCULADA' },
    })
    expect(transiciones).toHaveLength(1)
  })

  it('es idempotente: reclamar de nuevo no cambia nada ni duplica historial', async () => {
    const token = emitirClaimToken()
    const lead = await crearLead(token.hash)

    const primera = await reclamarLeadsPorHash(prisma, token.hash, usuarioId)
    const segunda = await reclamarLeadsPorHash(prisma, token.hash, usuarioId)

    expect(primera).toHaveLength(1)
    expect(segunda).toHaveLength(0)

    const transiciones = await prisma.transicionLead.count({
      where: { leadId: lead.id, tipo: 'CUENTA_VINCULADA' },
    })
    expect(transiciones).toBe(1)
  })

  it('otra cuenta no puede quedarse con un lead ya reclamado', async () => {
    const token = emitirClaimToken()
    const lead = await crearLead(token.hash)

    await reclamarLeadsPorHash(prisma, token.hash, usuarioId)
    const intruso = await reclamarLeadsPorHash(prisma, token.hash, otroUsuarioId)

    expect(intruso).toHaveLength(0)

    const enBase = await prisma.lead.findUnique({
      where: { id: lead.id },
      select: { compradorUsuarioId: true },
    })
    expect(enBase?.compradorUsuarioId).toBe(usuarioId)
  })

  it('una cookie inválida o vencida no reclama nada: el lead queda para el admin', async () => {
    const token = emitirClaimToken()
    const lead = await crearLead(token.hash)

    // La cookie no pasa la verificación, así que nunca llegamos a la base.
    expect(verificarClaimToken('token.manipulado.falso')).toBeNull()

    // Y con un hash que no corresponde a ningún lead, no se reclama nada.
    const reclamados = await reclamarLeadsPorHash(prisma, 'hash-que-no-existe', usuarioId)
    expect(reclamados).toHaveLength(0)

    const enBase = await prisma.lead.findUnique({
      where: { id: lead.id },
      select: { compradorUsuarioId: true },
    })
    expect(enBase?.compradorUsuarioId).toBeNull()
  })
})
