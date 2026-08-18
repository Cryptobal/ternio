import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  claveIdempotenciaAvisoLead,
  claveIdempotenciaCompraComprador,
  correoAvisoCompra,
  correoAvisoLead,
  correoProveedor,
  emailConfigurado,
  enviarCorreo,
  proveedoresAAvisar,
  remitenteResend,
  REMITENTE_RESEND_DEFAULT,
  URL_MIS_COTIZACIONES,
  URL_PANEL_PROVEEDOR,
} from '@/lib/email'
import type { LeadMatch, ProveedorMatch } from '@/lib/matching'

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
    verificadoAt: new Date('2026-08-18T11:00:00.000Z'),
    audiencia: 'empresa',
    ...parcial,
  }
}

function proveedor(parcial: Partial<ProveedorMatch> & { id?: string; email?: string | null } = {}) {
  const { id = 'prov-1', email = 'avisos@acme.cl', ...resto } = parcial
  return {
    id,
    email,
    estado: 'APROBADO',
    coberturaNacional: true,
    slug: 'acme-seguridad',
    solicitudEspera: {
      modo: 'nacional',
      rubros: ['seguridad'],
      regiones: [],
      provincias: [],
      comunas: [],
    },
    coberturas: [],
    ...resto,
  }
}

describe('email Resend', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('sin clave no está configurado y el envío es fail-soft', async () => {
    delete process.env.RESEND_API_KEY
    expect(emailConfigurado()).toBe(false)
    const cliente = vi.fn()
    const resultado = await enviarCorreo(
      {
        to: 'ana@empresa.cl',
        subject: 'Hola',
        html: '<p>Hola</p>',
        text: 'Hola',
        idempotencyKey: 'aviso-lead/l1/p1',
      },
      { cliente, apiKey: '' },
    )
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.motivo).toBe('sin-clave')
    expect(cliente).not.toHaveBeenCalled()
  })

  it('con cliente mock envía y no relanza si el cliente falla', async () => {
    const cliente = vi.fn(async () => {
      throw new Error('red caída')
    })
    const resultado = await enviarCorreo(
      {
        to: 'ana@empresa.cl',
        subject: 'Hola',
        html: '<p>Hola</p>',
        text: 'Hola',
        idempotencyKey: 'aviso-compra/c1',
      },
      { cliente, apiKey: 're_test' },
    )
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.motivo).toBe('error')
  })

  it('con cliente mock exitoso usa la idempotencia por proveedor+lead', async () => {
    const cliente = vi.fn(async () => ({ ok: true as const }))
    const envio = {
      to: 'avisos@acme.cl',
      ...correoAvisoLead({
        rubro: 'Servicio de seguridad',
        comuna: 'Providencia',
        precioExclusivoClp: 50_000,
        precioCompartidoClp: 20_000,
      }),
      idempotencyKey: claveIdempotenciaAvisoLead('lead-1', 'prov-9'),
    }
    const resultado = await enviarCorreo(envio, { cliente, apiKey: 're_test' })
    expect(resultado.ok).toBe(true)
    expect(cliente).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'avisos@acme.cl',
        idempotencyKey: 'aviso-lead/lead-1/prov-9',
      }),
    )
  })

  it('el remitente default es avisos@ternio.cl', () => {
    delete process.env.RESEND_FROM
    expect(remitenteResend()).toBe(REMITENTE_RESEND_DEFAULT)
    expect(remitenteResend('Ternio <hola@ternio.cl>')).toBe('Ternio <hola@ternio.cl>')
  })
})

describe('copy de avisos', () => {
  it('el aviso al proveedor es ficha anónima: rubro, comuna, precios, sin PII', () => {
    const correo = correoAvisoLead({
      rubro: 'Empresas de aseo',
      comuna: 'Ñuñoa',
      precioExclusivoClp: 25_000,
      precioCompartidoClp: 10_000,
    })
    const cuerpo = `${correo.subject}\n${correo.text}\n${correo.html}`
    expect(correo.subject).toMatch(/Ñuñoa/)
    expect(correo.subject).toMatch(/aseo/i)
    expect(cuerpo).toMatch(/25\.000|25000/)
    expect(cuerpo).toMatch(/10\.000|10000/)
    expect(cuerpo).toContain(URL_PANEL_PROVEEDOR)
    expect(cuerpo).not.toMatch(/Gard|teléfono|\+56|RUT|@comprador|razon social/i)
    expect(cuerpo).not.toMatch(/te van a contactar 5/i)
  })

  it('el aviso al comprador no nombra al proveedor', () => {
    const correo = correoAvisoCompra({ rubro: 'Control de plagas', comuna: 'Valdivia' })
    const cuerpo = `${correo.subject}\n${correo.text}\n${correo.html}`
    expect(cuerpo).toMatch(/Una empresa ya tiene tus datos y te va a contactar/)
    expect(cuerpo).toMatch(/Valdivia/)
    expect(cuerpo).toMatch(/plagas/i)
    expect(cuerpo).toContain(URL_MIS_COTIZACIONES)
    expect(cuerpo).not.toMatch(/Gard|Acme|proveedor/i)
    expect(claveIdempotenciaCompraComprador('cmp-1')).toBe('aviso-compra/cmp-1')
  })
})

describe('destinatarios del aviso de lead', () => {
  it('solo APROBADO que calza, un destino por proveedor, sin email se salta', () => {
    const destinos = proveedoresAAvisar(lead(), [
      proveedor({ id: 'si', email: 'ok@acme.cl' }),
      proveedor({ id: 'si', email: 'otro@acme.cl' }),
      proveedor({ id: 'sin-mail', email: null }),
      proveedor({
        id: 'otro-rubro',
        email: 'plagas@acme.cl',
        solicitudEspera: {
          modo: 'nacional',
          rubros: ['control-de-plagas'],
          regiones: [],
          provincias: [],
          comunas: [],
        },
      }),
      proveedor({ id: 'pendiente', email: 'no@acme.cl', estado: 'PENDIENTE' }),
    ])
    expect(destinos).toEqual([{ id: 'si', email: 'ok@acme.cl' }])
  })

  it('se llama después del commit en verify y en la toma', () => {
    const archivos = [
      'src/server/leads.ts',
      'src/server/otp.ts',
      'src/server/admin.ts',
      'src/server/marketplace.ts',
    ]
    const juntos = archivos
      .map((archivo) => readFileSync(resolve(process.cwd(), archivo), 'utf8'))
      .join('\n')
    expect(juntos).toContain('avisarProveedoresLeadVerificado')
    expect(juntos).toContain('avisarCompradorCompraPagada')
    expect(juntos).toContain('avisarAdminLeadCreado')
    expect(juntos).toContain('avisarAdminCompraPagada')
    const avisos = readFileSync(resolve(process.cwd(), 'src/server/avisos.ts'), 'utf8')
    expect(avisos).toContain('SELECT_FICHA_ANONIMA')
    const caraPublica = avisos.slice(0, avisos.indexOf('type EnviarAviso'))
    expect(caraPublica).toContain('avisarProveedoresLeadVerificado')
    expect(caraPublica).toContain('avisarCompradorCompraPagada')
    expect(caraPublica).not.toMatch(/proveedor\.nombre|razonSocial/)
  })

  it('toma el correo de la cuenta si el perfil no tiene', () => {
    expect(correoProveedor({ email: null, usuario: { email: 'dueño@acme.cl' } })).toBe(
      'dueño@acme.cl',
    )
    expect(correoProveedor({ email: 'malo', usuario: { email: null } })).toBeNull()
  })
})
