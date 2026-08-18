import { EstadoProveedor, TipoMovimientoCreditos, type PrismaClient } from '@prisma/client'

import { asientoAlta, claveAsientoAlta, saldoDesdeMovimientos } from '@/lib/creditos'
import { leerSnapshotCobertura, type SnapshotCoberturaProveedor } from '@/lib/cobertura'

export const GARD_SLUG = 'gard-security'
export const GARD_NOMBRE = 'Gard Security'

export const SNAPSHOT_COBERTURA_GARD: SnapshotCoberturaProveedor = {
  modo: 'nacional',
  regiones: [],
  provincias: [],
  comunas: [],
  rubros: ['seguridad'],
}

export function debeAcreditarPackGard(
  saldo: number,
  idempotencyKeys: readonly (string | null | undefined)[],
  proveedorId: string,
): boolean {
  if (saldo !== 0) return false
  return !idempotencyKeys.includes(claveAsientoAlta(proveedorId))
}

function snapshotConSeguridad(valor: unknown): SnapshotCoberturaProveedor {
  const snap = leerSnapshotCobertura(valor)
  if (!snap) return SNAPSHOT_COBERTURA_GARD
  const rubros = snap.rubros.includes('seguridad') ? snap.rubros : [...snap.rubros, 'seguridad']
  return { ...snap, rubros }
}

/**
 * Garantiza Gard Security (`gard-security` o una fila `gard*`) APROBADO,
 * con cobertura nacional + rubro seguridad, y pack de arranque (200.000,
 * `alta:{id}`) si el saldo es 0 y el asiento no existe.
 * Idempotente. El seed de Vercel no corre solo: también se llama en
 * `/admin` y `/panel`.
 */
export async function ensureGardSecurity(
  db: PrismaClient,
): Promise<{ id: string; slug: string; creado: boolean }> {
  const existente = await db.proveedor.findFirst({
    where: { OR: [{ slug: GARD_SLUG }, { slug: { startsWith: 'gard' } }] },
    select: { id: true, slug: true, solicitudEspera: true },
  })

  let id: string
  let slug: string
  let creado = false

  if (existente) {
    id = existente.id
    slug = existente.slug
    await db.proveedor.update({
      where: { id },
      data: {
        estado: EstadoProveedor.APROBADO,
        coberturaNacional: true,
        solicitudEspera: snapshotConSeguridad(existente.solicitudEspera),
      },
    })
  } else {
    const fila = await db.proveedor.create({
      data: {
        slug: GARD_SLUG,
        nombre: GARD_NOMBRE,
        razonSocial: GARD_NOMBRE,
        estado: EstadoProveedor.APROBADO,
        coberturaNacional: true,
        solicitudEspera: SNAPSHOT_COBERTURA_GARD,
      },
      select: { id: true, slug: true },
    })
    id = fila.id
    slug = fila.slug
    creado = true
  }

  const movimientos = await db.movimientoCreditos.findMany({
    where: { proveedorId: id },
    select: { montoCreditos: true, idempotencyKey: true },
  })
  const saldo = saldoDesdeMovimientos(movimientos.map((fila) => fila.montoCreditos))
  const keys = movimientos.map((fila) => fila.idempotencyKey)
  if (debeAcreditarPackGard(saldo, keys, id)) {
    const asiento = asientoAlta({ proveedorId: id, saldoActual: saldo })
    await db.movimientoCreditos.create({
      data: {
        proveedorId: id,
        tipo: TipoMovimientoCreditos.AJUSTE,
        montoCreditos: asiento.montoCreditos,
        saldoPosterior: asiento.saldoPosterior,
        idempotencyKey: asiento.idempotencyKey,
        descripcion: asiento.descripcion,
      },
    })
  }

  return { id, slug, creado }
}
