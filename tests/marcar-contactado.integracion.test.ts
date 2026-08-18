import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  EstadoCompraLead,
  EstadoLead,
  EstadoProveedor,
  ModoRubro,
  PrismaClient,
  RolUsuario,
  TipoCompraLead,
} from '@prisma/client'

import { toggleContactadoCompra } from '@/lib/contactado'

/**
 * Integración de «marcar como contactado».
 *
 *   TEST_DATABASE_URL="postgresql://…" pnpm test
 *
 * Sin esa variable el bloque se salta.
 */
const urlPruebas = process.env.TEST_DATABASE_URL

describe.skipIf(!urlPruebas)('marcar contactado contra la base de datos', () => {
  const prisma = new PrismaClient({ datasources: { db: { url: urlPruebas ?? '' } } })
  const sufijo = `test-contactado-${process.pid}`

  let rubroId = ''
  let comunaId = ''
  let proveedorId = ''
  let otroProveedorId = ''
  let compraId = ''
  let compraAjenaId = ''

  beforeAll(async () => {
    const rubro = await prisma.rubro.create({
      data: {
        slug: `rubro-${sufijo}`,
        nombre: 'Rubro contactado',
        modo: ModoRubro.VENTA,
        precioExclusivoClp: 50_000,
        precioCompartidoClp: 20_000,
      },
    })
    const comuna = await prisma.comuna.create({
      data: { slug: `comuna-${sufijo}`, nombre: 'Comuna contactado', region: 'RM' },
    })
    const usuario = await prisma.user.create({
      data: {
        email: `prov-${sufijo}@ejemplo.cl`,
        telefonoE164Verificado: `+5691${String(process.pid).padStart(7, '0').slice(0, 7)}`,
        rol: RolUsuario.PROVEEDOR,
      },
    })
    const otroUsuario = await prisma.user.create({
      data: {
        email: `otro-prov-${sufijo}@ejemplo.cl`,
        telefonoE164Verificado: `+5692${String(process.pid).padStart(7, '0').slice(0, 7)}`,
        rol: RolUsuario.PROVEEDOR,
      },
    })
    const proveedor = await prisma.proveedor.create({
      data: {
        usuarioId: usuario.id,
        slug: `prov-${sufijo}`,
        nombre: 'Proveedor prueba',
        rutNormalizado: `76${String(process.pid).padStart(6, '0').slice(0, 6)}k`,
        estado: EstadoProveedor.APROBADO,
      },
    })
    const otro = await prisma.proveedor.create({
      data: {
        usuarioId: otroUsuario.id,
        slug: `otro-prov-${sufijo}`,
        nombre: 'Otro proveedor',
        rutNormalizado: `77${String(process.pid).padStart(6, '0').slice(0, 6)}k`,
        estado: EstadoProveedor.APROBADO,
      },
    })
    const lead = await prisma.lead.create({
      data: {
        rubroId: rubro.id,
        comunaId: comuna.id,
        estado: EstadoLead.VERIFICADO,
        modoRubroAlCrear: ModoRubro.VENTA,
        rutValido: true,
        telefonoVerificado: true,
        verificadoAt: new Date(),
      },
    })
    const leadAjeno = await prisma.lead.create({
      data: {
        rubroId: rubro.id,
        comunaId: comuna.id,
        estado: EstadoLead.VERIFICADO,
        modoRubroAlCrear: ModoRubro.VENTA,
        rutValido: true,
        telefonoVerificado: true,
        verificadoAt: new Date(),
      },
    })
    const compra = await prisma.compraLead.create({
      data: {
        leadId: lead.id,
        proveedorId: proveedor.id,
        tipo: TipoCompraLead.COMPARTIDO,
        precioClp: 16_000,
        creditosConsumidos: 16_000,
        estado: EstadoCompraLead.PAGADA,
      },
    })
    const compraAjena = await prisma.compraLead.create({
      data: {
        leadId: leadAjeno.id,
        proveedorId: otro.id,
        tipo: TipoCompraLead.COMPARTIDO,
        precioClp: 16_000,
        creditosConsumidos: 16_000,
        estado: EstadoCompraLead.PAGADA,
      },
    })

    rubroId = rubro.id
    comunaId = comuna.id
    proveedorId = proveedor.id
    otroProveedorId = otro.id
    compraId = compra.id
    compraAjenaId = compraAjena.id
  })

  afterAll(async () => {
    await prisma.compraLead.deleteMany({
      where: { proveedorId: { in: [proveedorId, otroProveedorId] } },
    })
    await prisma.lead.deleteMany({ where: { rubroId } })
    await prisma.proveedor.deleteMany({ where: { id: { in: [proveedorId, otroProveedorId] } } })
    await prisma.user.deleteMany({
      where: { email: { contains: sufijo } },
    })
    await prisma.rubro.deleteMany({ where: { id: rubroId } })
    await prisma.comuna.deleteMany({ where: { id: comunaId } })
    await prisma.$disconnect()
  })

  it('marca y desmarca contactadoEn', async () => {
    const marcado = await toggleContactadoCompra(prisma, {
      compraId,
      proveedorId,
      ahora: new Date('2026-08-18T15:00:00.000Z'),
    })
    expect(marcado.ok).toBe(true)
    if (!marcado.ok) return
    expect(marcado.contactadoEn?.toISOString()).toBe('2026-08-18T15:00:00.000Z')

    const enBase = await prisma.compraLead.findUnique({
      where: { id: compraId },
      select: { contactadoEn: true },
    })
    expect(enBase?.contactadoEn?.toISOString()).toBe('2026-08-18T15:00:00.000Z')

    const desmarcado = await toggleContactadoCompra(prisma, { compraId, proveedorId })
    expect(desmarcado.ok).toBe(true)
    if (!desmarcado.ok) return
    expect(desmarcado.contactadoEn).toBeNull()
  })

  it('rechaza compra de otro proveedor', async () => {
    const resultado = await toggleContactadoCompra(prisma, {
      compraId: compraAjenaId,
      proveedorId,
    })
    expect(resultado.ok).toBe(false)
  })
})
