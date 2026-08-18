/**
 * Reglas de créditos. 1 crédito = 1 CLP.
 * El admin no es el cajero: el alta acredita sola; la recarga son packs.
 */

export const CREDITOS_ALTA = 200_000
export const CREDITOS_SEMILLA_GARD = 500_000

export const PACKS_CREDITOS = [
  { id: '50', montoClp: 50_000, etiqueta: 'Pack 50 mil' },
  { id: '200', montoClp: 200_000, etiqueta: 'Pack 200 mil' },
  { id: '500', montoClp: 500_000, etiqueta: 'Pack 500 mil' },
] as const

export type IdPack = (typeof PACKS_CREDITOS)[number]['id']

export function claveAsientoAlta(proveedorId: string): string {
  return `alta:${proveedorId}`
}

export function claveSemillaGard(proveedorId: string): string {
  return `semilla-gard:${proveedorId}`
}

export function packPorId(id: string): (typeof PACKS_CREDITOS)[number] | undefined {
  return PACKS_CREDITOS.find((pack) => pack.id === id)
}

/** Si ya hay un asiento con esa key, no se vuelve a acreditar. */
export function debeCrearAsientoAlta(idempotencyKeys: readonly (string | null | undefined)[]): boolean {
  return !idempotencyKeys.some((key) => typeof key === 'string' && key.startsWith('alta:'))
}

export function asientoAlta(args: {
  proveedorId: string
  saldoActual: number
}): {
  tipo: 'AJUSTE'
  montoCreditos: number
  saldoPosterior: number
  idempotencyKey: string
  descripcion: string
} {
  return {
    tipo: 'AJUSTE',
    montoCreditos: CREDITOS_ALTA,
    saldoPosterior: args.saldoActual + CREDITOS_ALTA,
    idempotencyKey: claveAsientoAlta(args.proveedorId),
    descripcion: 'Pack de arranque al confirmar el celular',
  }
}

export function saldoDesdeMovimientos(montos: readonly number[]): number {
  return montos.reduce((suma, monto) => suma + monto, 0)
}
