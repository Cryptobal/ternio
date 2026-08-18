import { describe, expect, it } from 'vitest'

import {
  esSlugGard,
  faseVentanaGard,
  factorFreshness,
  GARD_VENTANA_MS,
  geografiaCubreLead,
  leadSePuedeVender,
  puedeTomarLead,
  precioVigente,
  proveedorCubreLead,
  proveedorEsDuenioDelLead,
  resumenConfirmacionCompra,
  resumenCupos,
  slugsRubroDelProveedor,
  tramoFreshness,
  type LeadMatch,
  type ProveedorMatch,
} from '@/lib/matching'

const ahora = new Date('2026-08-18T12:00:00.000Z')

function lead(parcial: Partial<LeadMatch> = {}): LeadMatch {
  return {
    rubroSlug: 'seguridad',
    comunaSlug: 'santiago',
    region: 'Región Metropolitana',
    provincia: 'Santiago',
    estado: 'VERIFICADO',
    modoRubroAlCrear: 'VENTA',
    rutValido: true,
    telefonoVerificado: true,
    verificadoAt: new Date(ahora.getTime() - 60 * 60 * 1000),
    ...parcial,
  }
}

const leadProvidencia = () =>
  lead({ comunaSlug: 'providencia', region: 'Región Metropolitana', provincia: 'Santiago' })

function proveedor(parcial: Partial<ProveedorMatch> = {}): ProveedorMatch {
  return {
    estado: 'APROBADO',
    coberturaNacional: false,
    slug: 'acme-seguridad',
    solicitudEspera: { modo: 'comuna', rubros: ['seguridad'], regiones: [], provincias: [], comunas: ['santiago'] },
    coberturas: [{ rubroSlug: 'seguridad', comunaSlug: 'santiago', activa: true }],
    ...parcial,
  }
}

describe('matching', () => {
  it('cubre con coberturaNacional aunque no haya fila de comuna', () => {
    const nacional = proveedor({
      coberturaNacional: true,
      coberturas: [],
      solicitudEspera: { modo: 'nacional', rubros: ['seguridad'], regiones: [], provincias: [], comunas: [] },
    })
    expect(proveedorCubreLead(nacional, lead({ comunaSlug: 'valdivia' }))).toBe(true)
  })

  it('sin nacional ni snapshot geográfico exige Cobertura activa de rubro+comuna', () => {
    const local = proveedor({ coberturaNacional: false })
    expect(proveedorCubreLead(local, lead({ comunaSlug: 'santiago' }))).toBe(true)
    expect(proveedorCubreLead(local, lead({ comunaSlug: 'valdivia' }))).toBe(false)
  })

  it('snapshot RM + seguridad cubre Providencia sin fila Cobertura', () => {
    const rm = proveedor({
      coberturaNacional: false,
      coberturas: [],
      solicitudEspera: {
        modo: 'region',
        rubros: ['seguridad'],
        regiones: ['Región Metropolitana'],
        provincias: [],
        comunas: [],
      },
    })
    expect(proveedorCubreLead(rm, leadProvidencia())).toBe(true)
    expect(
      proveedorCubreLead(
        rm,
        lead({ comunaSlug: 'valdivia', region: 'Región de Los Ríos', provincia: 'Valdivia' }),
      ),
    ).toBe(false)
  })

  it('snapshot provincia Santiago cubre Providencia', () => {
    const provincia = proveedor({
      coberturaNacional: false,
      coberturas: [],
      solicitudEspera: {
        modo: 'provincia',
        rubros: ['seguridad'],
        regiones: [],
        provincias: [{ region: 'Región Metropolitana', provincia: 'Santiago' }],
        comunas: [],
      },
    })
    expect(proveedorCubreLead(provincia, leadProvidencia())).toBe(true)
  })

  it('snapshot comuna providencia cubre el lead de prod', () => {
    const local = proveedor({
      coberturaNacional: false,
      coberturas: [],
      solicitudEspera: {
        modo: 'comuna',
        rubros: ['seguridad'],
        regiones: [],
        provincias: [],
        comunas: ['providencia'],
      },
    })
    expect(proveedorCubreLead(local, leadProvidencia())).toBe(true)
    expect(geografiaCubreLead(local, lead({ comunaSlug: 'santiago' }))).toBe(false)
  })

  it('fila Cobertura providencia+seguridad cubre aunque el snapshot esté vacío', () => {
    const porFila = proveedor({
      coberturaNacional: false,
      solicitudEspera: { modo: 'comuna', rubros: [], regiones: [], provincias: [], comunas: [] },
      coberturas: [{ rubroSlug: 'seguridad', comunaSlug: 'providencia', activa: true }],
    })
    expect(proveedorCubreLead(porFila, leadProvidencia())).toBe(true)
  })

  it('el rubro tiene que estar en el snapshot o en coberturas', () => {
    const soloAseo = proveedor({
      solicitudEspera: { modo: 'nacional', rubros: ['aseo'], regiones: [], provincias: [], comunas: [] },
      coberturaNacional: true,
      coberturas: [],
    })
    expect(proveedorCubreLead(soloAseo, lead())).toBe(false)
    expect(slugsRubroDelProveedor(soloAseo)).toEqual(['aseo'])
  })

  it('no ofrece CAPTURA, no verificado o de más de 7 días', () => {
    expect(leadSePuedeVender(lead({ modoRubroAlCrear: 'CAPTURA' }), ahora)).toBe(false)
    expect(leadSePuedeVender(lead({ telefonoVerificado: false }), ahora)).toBe(false)
    expect(
      leadSePuedeVender(lead({ verificadoAt: new Date(ahora.getTime() - 8 * 24 * 60 * 60 * 1000) }), ahora),
    ).toBe(false)
  })
})

describe('freshness', () => {
  it('100% / −20% / −50% / fuera a los 7 días', () => {
    const base = 50_000
    expect(factorFreshness(ahora, ahora)).toBe(1)
    expect(precioVigente(base, new Date(ahora.getTime() - 23 * 60 * 60 * 1000), ahora)).toBe(50_000)
    expect(precioVigente(base, new Date(ahora.getTime() - 25 * 60 * 60 * 1000), ahora)).toBe(40_000)
    expect(precioVigente(base, new Date(ahora.getTime() - 4 * 24 * 60 * 60 * 1000), ahora)).toBe(25_000)
    expect(precioVigente(base, new Date(ahora.getTime() - 8 * 24 * 60 * 60 * 1000), ahora)).toBeNull()
  })

  it('tramos: bordes 24 h / 72 h / 7 días', () => {
    const verificado = new Date(ahora.getTime() - 30 * 60 * 60 * 1000)
    const t30 = tramoFreshness(verificado, ahora)
    expect(t30.tramo).toBe(1)
    expect(t30.factor).toBe(0.8)
    expect(t30.proximoCambioAt?.getTime()).toBe(verificado.getTime() + 72 * 60 * 60 * 1000)

    expect(tramoFreshness(ahora, ahora)).toMatchObject({ tramo: 0, factor: 1 })
    expect(
      tramoFreshness(new Date(ahora.getTime() - 24 * 60 * 60 * 1000), ahora),
    ).toMatchObject({ tramo: 1, factor: 0.8 })
    expect(
      tramoFreshness(new Date(ahora.getTime() - 72 * 60 * 60 * 1000), ahora),
    ).toMatchObject({ tramo: 2, factor: 0.5 })
    expect(
      tramoFreshness(new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000), ahora),
    ).toMatchObject({ tramo: 3, factor: null, proximoCambioAt: null })
  })

  it('resumen de confirmación: saldo después = saldo − precio', () => {
    expect(resumenConfirmacionCompra(140_000, 16_000)).toEqual({
      saldoDespues: 124_000,
      faltante: 0,
      alcanza: true,
    })
    expect(resumenConfirmacionCompra(10_000, 16_000)).toEqual({
      saldoDespues: -6_000,
      faltante: 6_000,
      alcanza: false,
    })
  })
})

describe('Gard 15 min', () => {
  it('reconoce slugs gard', () => {
    expect(esSlugGard('gard-security')).toBe(true)
    expect(esSlugGard('gard-norte')).toBe(true)
    expect(esSlugGard('acme')).toBe(false)
  })

  it('reserva el lead a Gard y después lo libera', () => {
    const verificadoAt = new Date(ahora.getTime() - 5 * 60 * 1000)
    const reservado = faseVentanaGard({
      rubroSlug: 'seguridad',
      verificadoAt,
      hayGardQueCalza: true,
      slugProveedor: 'acme',
      ahora,
    })
    expect(reservado.fase).toBe('reservado')
    expect(reservado.restanteMs).toBeGreaterThan(0)

    const paraGard = faseVentanaGard({
      rubroSlug: 'seguridad',
      verificadoAt,
      hayGardQueCalza: true,
      slugProveedor: 'gard-security',
      ahora,
    })
    expect(paraGard.fase).toBe('para-gard')

    const libre = faseVentanaGard({
      rubroSlug: 'seguridad',
      verificadoAt: new Date(ahora.getTime() - GARD_VENTANA_MS - 1000),
      hayGardQueCalza: true,
      slugProveedor: 'acme',
      ahora,
    })
    expect(libre.fase).toBe('libre')
  })

  it('si no hay Gard que calce, no hay ventana', () => {
    const fase = faseVentanaGard({
      rubroSlug: 'seguridad',
      verificadoAt: ahora,
      hayGardQueCalza: false,
      slugProveedor: 'acme',
      ahora,
    })
    expect(fase.fase).toBe('libre')
  })
})

describe('tomar lead · cupos', () => {
  const base = {
    proveedor: proveedor(),
    lead: lead(),
    saldo: 500_000,
    precioClp: 20_000,
    hayGardQueCalza: false,
    ahora,
  }

  it('exclusivo bloquea al segundo', () => {
    const primero = puedeTomarLead({ ...base, tipo: 'EXCLUSIVO', compras: [] })
    expect(primero.ok).toBe(true)
    const segundo = puedeTomarLead({
      ...base,
      tipo: 'EXCLUSIVO',
      compras: [{ tipo: 'EXCLUSIVO', estado: 'PAGADA' }],
    })
    expect(segundo.ok).toBe(false)
    expect(resumenCupos([{ tipo: 'EXCLUSIVO', estado: 'PAGADA' }]).puedeCompartido).toBe(false)
  })

  it('compartido admite 3 y no el cuarto', () => {
    const dos = [{ tipo: 'COMPARTIDO' as const, estado: 'PAGADA' as const }, { tipo: 'COMPARTIDO' as const, estado: 'PAGADA' as const }]
    expect(puedeTomarLead({ ...base, tipo: 'COMPARTIDO', compras: dos }).ok).toBe(true)
    const tres = [...dos, { tipo: 'COMPARTIDO' as const, estado: 'PAGADA' as const }]
    expect(puedeTomarLead({ ...base, tipo: 'COMPARTIDO', compras: tres }).ok).toBe(false)
    expect(resumenCupos(tres).cuposCompartidoRestantes).toBe(0)
  })

  it('sin saldo no toma', () => {
    const resultado = puedeTomarLead({ ...base, tipo: 'COMPARTIDO', compras: [], saldo: 100 })
    expect(resultado.ok).toBe(false)
  })

  it('bloquea si el RUT del proveedor es el del contacto del lead', () => {
    const resultado = puedeTomarLead({
      ...base,
      tipo: 'COMPARTIDO',
      compras: [],
      rutProveedor: '76.482.113-0',
      rutLeadContacto: '76482113-0',
    })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.motivo).toMatch(/propia empresa/i)
    }
  })

  it('permite tomar si los RUT no calzan', () => {
    const resultado = puedeTomarLead({
      ...base,
      tipo: 'COMPARTIDO',
      compras: [],
      rutProveedor: '76.482.113-0',
      rutLeadContacto: '12.345.678-5',
    })
    expect(resultado.ok).toBe(true)
  })
})

describe('proveedorEsDuenioDelLead', () => {
  it('compara formas normalizadas del mismo RUT', () => {
    expect(proveedorEsDuenioDelLead('76.482.113-0', '76482113-0')).toBe(true)
    expect(proveedorEsDuenioDelLead('76.482.113-0', '12.345.678-5')).toBe(false)
    expect(proveedorEsDuenioDelLead(null, '12.345.678-5')).toBe(false)
  })
})
