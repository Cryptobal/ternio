import { EstadoProveedor, TipoMovimientoCreditos, type PrismaClient } from '@prisma/client'

import { asientoAlta, claveAsientoAlta, saldoDesdeMovimientos } from '@/lib/creditos'
import { leerSnapshotCobertura, type SnapshotCoberturaProveedor } from '@/lib/cobertura'
import { normalizarRut, variantesRutPersistido } from '@/lib/rut'

export const GARD_SLUG = 'gard-security'
export const GARD_NOMBRE = 'Gard Security'
/** Siempre el output de `normalizarRut`. Nunca un string solo-dígitos. */
export const GARD_RUT = normalizarRut('77.840.623-3')

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

export function esRutGard(rut: string | null | undefined): boolean {
  const canon = normalizarRut(rut)
  return canon !== null && GARD_RUT !== null && canon === GARD_RUT
}

/** Si hay dos filas con el mismo RUT, gana `gard-security`. No se inventa otra. */
export function elegirFilaProveedorPorRut<T extends { slug: string }>(
  filas: readonly T[],
): T | undefined {
  return (
    filas.find((fila) => fila.slug === GARD_SLUG) ??
    filas.find((fila) => fila.slug.startsWith('gard')) ??
    filas[0]
  )
}

export function slugAltaProveedor(rutNormalizado: string, slugExistente?: string): string {
  if (slugExistente) return slugExistente
  if (esRutGard(rutNormalizado)) return GARD_SLUG
  const canon = normalizarRut(rutNormalizado) ?? rutNormalizado
  const cuerpo = canon.split('-')[0] ?? canon
  return `prov-${cuerpo}`
}

function snapshotConSeguridad(valor: unknown): SnapshotCoberturaProveedor {
  const snap = leerSnapshotCobertura(valor)
  if (!snap) return SNAPSHOT_COBERTURA_GARD
  const rubros = snap.rubros.includes('seguridad') ? snap.rubros : [...snap.rubros, 'seguridad']
  return { ...snap, rubros }
}

/**
 * Garantiza Gard Security (`gard-security` o una fila `gard*`) APROBADO,
 * con cobertura nacional + rubro seguridad, y pack de arranque (50.000,
 * `alta:{id}`) si el saldo es 0 y el asiento no existe.
 * Idempotente. El seed de Vercel no corre solo: también se llama en
 * `/admin` y `/panel`.
 */
export async function ensureGardSecurity(
  db: PrismaClient,
): Promise<{ id: string; slug: string; creado: boolean }> {
  const existente = await db.proveedor.findFirst({
    where: { OR: [{ slug: GARD_SLUG }, { slug: { startsWith: 'gard' } }] },
    select: { id: true, slug: true, solicitudEspera: true, rutNormalizado: true },
  })

  let id: string
  let slug: string
  let creado = false

  if (existente) {
    id = existente.id
    slug = existente.slug
    const rutCanon =
      slug === GARD_SLUG
        ? (GARD_RUT ?? normalizarRut(existente.rutNormalizado))
        : normalizarRut(existente.rutNormalizado)
    const rutLibre = rutCanon
      ? !(await db.proveedor.findFirst({
          where: {
            rutNormalizado: { in: variantesRutPersistido(rutCanon) },
            NOT: { id },
          },
          select: { id: true },
        }))
      : false
    await db.proveedor.update({
      where: { id },
      data: {
        estado: EstadoProveedor.APROBADO,
        coberturaNacional: true,
        solicitudEspera: snapshotConSeguridad(existente.solicitudEspera),
        ...(rutLibre && rutCanon ? { rutNormalizado: rutCanon } : {}),
      },
    })
  } else {
    const rutLibre = GARD_RUT
      ? !(await db.proveedor.findFirst({
          where: { rutNormalizado: { in: variantesRutPersistido(GARD_RUT) } },
          select: { id: true },
        }))
      : false
    const fila = await db.proveedor.create({
      data: {
        slug: GARD_SLUG,
        nombre: GARD_NOMBRE,
        razonSocial: GARD_NOMBRE,
        estado: EstadoProveedor.APROBADO,
        coberturaNacional: true,
        solicitudEspera: SNAPSHOT_COBERTURA_GARD,
        ...(rutLibre && GARD_RUT ? { rutNormalizado: GARD_RUT } : {}),
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
