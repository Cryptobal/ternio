import { describe, expect, it } from 'vitest'

import {
  asientoAlta,
  claveAsientoAlta,
  CREDITOS_ALTA,
  debeCrearAsientoAlta,
  packPorId,
  saldoDesdeMovimientos,
} from '@/lib/creditos'

describe('asiento de alta (idempotente)', () => {
  it('usa la key alta:{proveedorId} y 200.000 créditos', () => {
    expect(claveAsientoAlta('prov-1')).toBe('alta:prov-1')
    const asiento = asientoAlta({ proveedorId: 'prov-1', saldoActual: 0 })
    expect(asiento.montoCreditos).toBe(CREDITOS_ALTA)
    expect(asiento.montoCreditos).toBe(200_000)
    expect(asiento.idempotencyKey).toBe('alta:prov-1')
    expect(asiento.tipo).toBe('AJUSTE')
    expect(asiento.saldoPosterior).toBe(200_000)
  })

  it('no duplica si ya existe un asiento alta:', () => {
    expect(debeCrearAsientoAlta([])).toBe(true)
    expect(debeCrearAsientoAlta([null, 'flow:pack:p:50:n'])).toBe(true)
    expect(debeCrearAsientoAlta(['alta:prov-1'])).toBe(false)
    expect(debeCrearAsientoAlta([claveAsientoAlta('otro')])).toBe(false)
  })

  it('el saldo es la suma del ledger', () => {
    expect(saldoDesdeMovimientos([200_000, -20_000, 50_000])).toBe(230_000)
  })

  it('los packs son 50 / 200 / 500 mil', () => {
    expect(packPorId('50')?.montoClp).toBe(50_000)
    expect(packPorId('200')?.montoClp).toBe(200_000)
    expect(packPorId('500')?.montoClp).toBe(500_000)
  })
})
