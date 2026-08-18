import { describe, expect, it } from 'vitest'

import {
  esSlugGard,
  faseVentanaGard,
  factorFreshness,
  GARD_VENTANA_MS,
  leadSePuedeVender,
  puedeTomarLead,
  precioVigente,
  proveedorCubreLead,
  resumenCupos,
  slugsRubroDelProveedor,
  type LeadMatch,
  type ProveedorMatch,
} from '@/lib/matching'

const ahora = new Date('2026-08-18T12:00:00.000Z')

function lead(parcial: Partial<LeadMatch> = {}): LeadMatch {
  return {
    rubroSlug: 'seguridad',
    comunaSlug: 'santiago',
    estado: 'VERIFICADO',
    modoRubroAlCrear: 'VENTA',
    rutValido: true,
    telefonoVerificado: true,
    verificadoAt: new Date(ahora.getTime() - 60 * 60 * 1000),
    ...parcial,
  }
}

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

  it('sin nacional exige Cobertura activa de rubro+comuna', () => {
    const local = proveedor({ coberturaNacional: false })
    expect(proveedorCubreLead(local, lead({ comunaSlug: 'santiago' }))).toBe(true)
    expect(proveedorCubreLead(local, lead({ comunaSlug: 'valdivia' }))).toBe(false)
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
})
