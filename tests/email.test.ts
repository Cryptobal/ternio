import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  emailHabilitado,
  enviarEmail,
  remitenteEmail,
  REMITENTE_EMAIL_DEFAULT,
  type ClienteEmail,
} from '@/lib/email'
import {
  asuntoLeadAVenta,
  asuntoLeadTomado,
  claveAvisoLeadTomado,
  claveAvisoLeadVenta,
  cuerpoLeadAVenta,
  cuerpoLeadTomado,
  proveedoresAAvisar,
  urlPublicaSitio,
} from '@/lib/email-avisos'
import type { LeadMatch, ProveedorMatch } from '@/lib/matching'

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

function proveedor(parcial: Partial<ProveedorMatch> = {}): ProveedorMatch {
  return {
    estado: 'APROBADO',
    coberturaNacional: true,
    slug: 'acme-seguridad',
    solicitudEspera: { modo: 'nacional', rubros: ['seguridad'], regiones: [], provincias: [], comunas: [] },
    coberturas: [],
    ...parcial,
  }
}

describe('enviarEmail', () => {
  const originalKey = process.env.RESEND_API_KEY
  const originalFrom = process.env.RESEND_FROM

  afterEach(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
    if (originalFrom === undefined) delete process.env.RESEND_FROM
    else process.env.RESEND_FROM = originalFrom
  })

  it('sin API key omite el envío y no llama a la red', async () => {
    delete process.env.RESEND_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const cliente: ClienteEmail = { send: vi.fn() }

    expect(emailHabilitado()).toBe(false)
    const resultado = await enviarEmail(
      { to: 'a@b.cl', subject: 'x', text: 'y' },
      { cliente },
    )

    expect(resultado).toEqual({ ok: true, omitido: true })
    expect(cliente.send).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('con cliente inyectado envía y no lanza si Resend falla', async () => {
    process.env.RESEND_API_KEY = 're_test'
    const cliente: ClienteEmail = {
      send: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    }
    const resultado = await enviarEmail(
      { to: 'proveedor@empresa.cl', subject: 'Hola', text: 'Cuerpo', idempotencyKey: 'k1' },
      { cliente },
    )
    expect(resultado.ok).toBe(false)
    expect(cliente.send).toHaveBeenCalledOnce()
  })

  it('usa RESEND_FROM o el remitente por defecto', () => {
    delete process.env.RESEND_FROM
    expect(remitenteEmail()).toBe(REMITENTE_EMAIL_DEFAULT)
    expect(remitenteEmail('Avisos <hola@ternio.cl>')).toBe('Avisos <hola@ternio.cl>')
  })
})

describe('copy de avisos', () => {
  it('la ficha a proveedores no lleva PII del comprador ni prueba social falsa', () => {
    const cuerpo = cuerpoLeadAVenta({
      rubro: 'Seguridad privada',
      comuna: 'Las Condes',
      precioExclusivoClp: 50_000,
      precioCompartidoClp: 20_000,
      urlPanel: 'https://www.ternio.cl/panel',
    })
    const asunto = asuntoLeadAVenta('Seguridad privada', 'Las Condes')
    expect(asunto).toBe('Hay una solicitud de Seguridad privada en Las Condes')
    expect(cuerpo).toMatch(/Las Condes/)
    expect(cuerpo).toMatch(/ternio\.cl\/panel/)
    expect(cuerpo).not.toMatch(/Juan|9\s?8123|\+569|rut|11\.111|@gmail/i)
    expect(cuerpo).not.toMatch(/te van a contactar 5|cinco empresas/i)
    expect(`${asunto}\n${cuerpo}`).not.toMatch(/nombreContacto|telefonoE164|razonSocial/)
  })

  it('al comprador le avisa el take sin nombrar al proveedor', () => {
    const cuerpo = cuerpoLeadTomado({
      rubro: 'Aseo',
      comuna: 'Ñuñoa',
      urlCotizaciones: 'https://www.ternio.cl/mis-cotizaciones',
    })
    expect(asuntoLeadTomado()).toBe('Una empresa ya tiene tus datos')
    expect(cuerpo).toMatch(/Una empresa ya tiene tus datos y te va a contactar/)
    expect(cuerpo).toMatch(/Aseo en Ñuñoa/)
    expect(cuerpo).toMatch(/mis-cotizaciones/)
    expect(cuerpo).not.toMatch(/Gard|proveedor@|teléfono del proveedor/i)
    expect(cuerpo).not.toMatch(/te van a contactar 5/i)
  })

  it('las claves de dedup son por proveedor\+lead y por compra', () => {
    expect(claveAvisoLeadVenta('lead1', 'prov1')).toBe('aviso-lead-venta:lead1:prov1')
    expect(claveAvisoLeadVenta('lead1', 'prov1')).not.toBe(claveAvisoLeadVenta('lead1', 'prov2'))
    expect(claveAvisoLeadTomado('compra1')).toBe('aviso-lead-tomado:compra1')
    expect(urlPublicaSitio('https://www.ternio.cl/')).toBe('https://www.ternio.cl')
  })
})

describe('quién recibe el aviso de lead a la venta', () => {
  it('solo APROBADO que calza; también durante la ventana Gard', () => {
    const fresco = lead({ verificadoAt: ahora })
    const lista = proveedoresAAvisar(fresco, [
      proveedor({ slug: 'gard-security' }),
      proveedor({ slug: 'otra', estado: 'PENDIENTE' }),
      proveedor({
        slug: 'aseo-sur',
        solicitudEspera: { modo: 'nacional', rubros: ['aseo'], regiones: [], provincias: [], comunas: [] },
        coberturas: [],
      }),
    ])
    expect(lista.map((item) => item.slug)).toEqual(['gard-security'])
  })

  it('no avisa si el lead aún no se puede vender', () => {
    expect(proveedoresAAvisar(lead({ estado: 'RECIBIDO' }), [proveedor()])).toEqual([])
  })
})
