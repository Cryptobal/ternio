import { EstadoCompraLead, type Prisma, type PrismaClient } from '@prisma/client'

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Toggle de «ya contacté» sobre una CompraLead propia.
 * Ownership en servidor: si la compra no existe o es de otro proveedor,
 * responde error genérico (sin filtrar existencia).
 */
export async function toggleContactadoCompra(
  db: Db,
  args: { compraId: string; proveedorId: string; ahora?: Date },
): Promise<{ ok: true; contactadoEn: Date | null } | { ok: false; mensaje: string }> {
  const compra = await db.compraLead.findFirst({
    where: {
      id: args.compraId,
      proveedorId: args.proveedorId,
      estado: EstadoCompraLead.PAGADA,
    },
    select: { id: true, contactadoEn: true },
  })
  if (!compra) {
    return { ok: false, mensaje: 'No encontramos esa compra.' }
  }
  const contactadoEn = compra.contactadoEn ? null : (args.ahora ?? new Date())
  await db.compraLead.update({
    where: { id: compra.id },
    data: { contactadoEn },
  })
  return { ok: true, contactadoEn }
}
