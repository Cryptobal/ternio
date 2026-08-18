import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'

import {
  clavePagoFlow,
  comercioOrderPack,
  decisionAcreditarFlow,
  firmarParamsFlow,
  FLOW_API_URL_PRODUCCION,
  FLOW_API_URL_SANDBOX,
  FLOW_STATUS_PAGADA,
  leerComercioOrderPack,
  pagoFlowPagado,
  paramsConFirma,
  urlApiFlow,
} from '@/lib/flow'

const SECRET = 'test-secret'

describe('firma Flow', () => {
  it('ordena nombres, concatena nombrevalor y firma HMAC-SHA256 hex', () => {
    const params = {
      amount: 50_000,
      apiKey: 'test-key',
      commerceOrder: 'pack:abc:50:nonce1',
    }
    const toSign = 'amount50000apiKeytest-keycommerceOrderpack:abc:50:nonce1'
    const esperado = createHmac('sha256', SECRET).update(toSign).digest('hex')
    expect(firmarParamsFlow(params, SECRET)).toBe(esperado)
  })

  it('no incluye el campo s en la cadena a firmar', () => {
    const conS = firmarParamsFlow({ amount: 1, s: 'basura', apiKey: 'k' }, SECRET)
    const sinS = firmarParamsFlow({ amount: 1, apiKey: 'k' }, SECRET)
    expect(conS).toBe(sinS)
  })

  it('paramsConFirma agrega s', () => {
    const firmados = paramsConFirma({ apiKey: 'k', token: 't' }, SECRET)
    expect(firmados.s).toBe(firmarParamsFlow({ apiKey: 'k', token: 't' }, SECRET))
    expect(firmados.apiKey).toBe('k')
    expect(firmados.token).toBe('t')
  })
})

describe('commerceOrder de pack', () => {
  it('arma y lee pack:{proveedorId}:{packId}:{nonce}', () => {
    const orden = comercioOrderPack('prov_1', '200', 'aa11')
    expect(orden).toBe('pack:prov_1:200:aa11')
    expect(leerComercioOrderPack(orden)).toEqual({ proveedorId: 'prov_1', packId: '200' })
  })

  it('rechaza órdenes que no son pack Ternio', () => {
    expect(leerComercioOrderPack('mp:123')).toBeNull()
    expect(leerComercioOrderPack('pack:solo-dos')).toBeNull()
    expect(leerComercioOrderPack('pack:p1:999:nonce')).toBeNull()
    expect(leerComercioOrderPack('')).toBeNull()
  })
})

describe('idempotencyKey Flow', () => {
  it('prioriza commerceOrder', () => {
    expect(clavePagoFlow({ commerceOrder: 'pack:p:50:n', flowOrder: 99 })).toBe(
      'flow:pack:p:50:n',
    )
  })

  it('cae a flowOrder si no hay commerceOrder', () => {
    expect(clavePagoFlow({ flowOrder: 441122 })).toBe('flow:441122')
  })
})

describe('acreditar solo si Flow confirma status 2', () => {
  const base = {
    amount: 50_000,
    commerceOrder: comercioOrderPack('prov1', '50', 'n1'),
    flowOrder: 77,
  }

  it('acredita status 2 con monto y orden válidos', () => {
    const d = decisionAcreditarFlow({ ...base, status: FLOW_STATUS_PAGADA })
    expect(d).toEqual({
      ok: true,
      proveedorId: 'prov1',
      packId: '50',
      montoClp: 50_000,
      idempotencyKey: 'flow:pack:prov1:50:n1',
    })
  })

  it('no acredita pendiente (1), rechazada (3) ni anulada (4)', () => {
    expect(decisionAcreditarFlow({ ...base, status: 1 })).toEqual({
      ok: false,
      motivo: 'pendiente',
    })
    expect(decisionAcreditarFlow({ ...base, status: 3 })).toEqual({
      ok: false,
      motivo: 'rechazado',
    })
    expect(decisionAcreditarFlow({ ...base, status: 4 })).toEqual({
      ok: false,
      motivo: 'rechazado',
    })
    expect(pagoFlowPagado(1)).toBe(false)
    expect(pagoFlowPagado(2)).toBe(true)
  })

  it('no acredita si el monto no es el del pack', () => {
    expect(decisionAcreditarFlow({ ...base, status: 2, amount: 49_000 })).toEqual({
      ok: false,
      motivo: 'monto',
    })
  })

  it('no acredita si la orden no es un pack', () => {
    expect(
      decisionAcreditarFlow({
        status: 2,
        amount: 50_000,
        commerceOrder: 'otra-cosa',
        flowOrder: 1,
      }),
    ).toEqual({ ok: false, motivo: 'orden' })
  })
})

describe('urlApiFlow', () => {
  const prevUrl = process.env.FLOW_API_URL
  const prevSandbox = process.env.FLOW_SANDBOX

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.FLOW_API_URL
    else process.env.FLOW_API_URL = prevUrl
    if (prevSandbox === undefined) delete process.env.FLOW_SANDBOX
    else process.env.FLOW_SANDBOX = prevSandbox
  })

  it('usa FLOW_API_URL si está, si no sandbox o producción', () => {
    process.env.FLOW_API_URL = 'https://custom.flow.cl/api/'
    delete process.env.FLOW_SANDBOX
    expect(urlApiFlow()).toBe('https://custom.flow.cl/api')

    delete process.env.FLOW_API_URL
    process.env.FLOW_SANDBOX = 'true'
    expect(urlApiFlow()).toBe(FLOW_API_URL_SANDBOX)

    process.env.FLOW_SANDBOX = '0'
    expect(urlApiFlow()).toBe(FLOW_API_URL_PRODUCCION)
  })
})
