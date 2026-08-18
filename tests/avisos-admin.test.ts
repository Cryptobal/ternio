import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_AVISO_EMAIL_DEFAULT,
  claveIdempotenciaAdminCompra,
  claveIdempotenciaAdminLead,
  claveIdempotenciaAdminProveedorAlta,
  correoAdminAltaProveedor,
  correoAdminCompra,
  correoAdminLeadCreado,
  correoAdminLeadVerificado,
  debeAvisarAdminLeadVerificado,
  emailAdminAvisos,
  omitirAvisoAltaProveedor,
  URL_ADMIN,
} from '@/lib/email'
import {
  avisarAdminAltaProveedor,
  avisarAdminCompraPagada,
  avisarAdminLeadCreado,
  avisarAdminLeadVerificado,
} from '@/server/avisos'

const leadAdmin = {
  rubro: 'Servicio de seguridad',
  comuna: 'Providencia',
  estado: 'RECIBIDO',
  nombreContacto: 'Ana Pérez',
  email: 'ana@empresa.cl',
  telefonoE164: '+56911111111',
  rutNormalizado: '76777530-8',
  razonSocial: 'Empresa Demo SpA',
  audiencia: 'empresa',
}

describe('destinatario e idempotencia admin', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('el destinatario default es carlos.irigoyen@gmail.com', () => {
    delete process.env.ADMIN_AVISO_EMAIL
    expect(emailAdminAvisos()).toBe(ADMIN_AVISO_EMAIL_DEFAULT)
    expect(emailAdminAvisos('')).toBe(ADMIN_AVISO_EMAIL_DEFAULT)
    expect(emailAdminAvisos('  ')).toBe(ADMIN_AVISO_EMAIL_DEFAULT)
    expect(emailAdminAvisos('otro@ternio.cl')).toBe('otro@ternio.cl')
  })

  it('las keys de idempotencia siguen el contrato admin:{tipo}:{id}', () => {
    expect(claveIdempotenciaAdminLead('lead-1', 'RECIBIDO')).toBe('admin:lead:lead-1:RECIBIDO')
    expect(claveIdempotenciaAdminLead('lead-1', 'VERIFICADO')).toBe('admin:lead:lead-1:VERIFICADO')
    expect(claveIdempotenciaAdminProveedorAlta('prov-9')).toBe('admin:proveedor:prov-9:alta')
    expect(claveIdempotenciaAdminCompra('cmp-3')).toBe('admin:compra:cmp-3')
  })

  it('omite Gard seed / ensureGard y no omite un alta real', () => {
    expect(omitirAvisoAltaProveedor('gard-security')).toBe(true)
    expect(omitirAvisoAltaProveedor('gard-otra')).toBe(true)
    expect(omitirAvisoAltaProveedor('prov-76777530')).toBe(false)
  })

  it('un solo correo si ya nació VERIFICADO; el corto solo si estaba pendiente', () => {
    expect(debeAvisarAdminLeadVerificado('VERIFICADO')).toBe(false)
    expect(debeAvisarAdminLeadVerificado('RECIBIDO')).toBe(true)
    expect(debeAvisarAdminLeadVerificado('EN_REVISION')).toBe(true)
  })
})

describe('copy de avisos admin', () => {
  it('nueva cotización lleva PII, estado, audiencia y link al admin', () => {
    const correo = correoAdminLeadCreado(leadAdmin)
    const cuerpo = `${correo.subject}\n${correo.text}\n${correo.html}`
    expect(correo.subject).toBe('Nueva cotización: Servicio de seguridad en Providencia')
    expect(cuerpo).toMatch(/pendiente de confirmar teléfono/)
    expect(cuerpo).toMatch(/empresa/)
    expect(cuerpo).toContain('Ana Pérez')
    expect(cuerpo).toContain('+56911111111')
    expect(cuerpo).toContain('ana@empresa.cl')
    expect(cuerpo).toContain('Empresa Demo SpA')
    expect(cuerpo).toContain(URL_ADMIN)
    expect(cuerpo).not.toMatch(/15 min|ventana|derecho preferente/i)
  })

  it('el corto de verificada no vuelve a mandar toda la ficha', () => {
    const correo = correoAdminLeadVerificado(leadAdmin)
    expect(correo.subject).toMatch(/verificada/i)
    expect(correo.text).toMatch(/ya está verificada y a la venta/)
    expect(correo.text).not.toContain('Ana Pérez')
    expect(correo.text).toContain(URL_ADMIN)
  })

  it('alta y toma usan los subjects pedidos', () => {
    const alta = correoAdminAltaProveedor({
      slug: 'prov-76777530',
      nombre: 'Acme Seguridad',
      razonSocial: 'Acme Seguridad SpA',
      rutNormalizado: '76777530-8',
      email: 'dueño@acme.cl',
      telefonoE164: '+56922222222',
    })
    expect(alta.subject).toBe('Proveedor nuevo: Acme Seguridad SpA')

    const toma = correoAdminCompra({
      rubro: 'Empresas de aseo',
      comuna: 'Ñuñoa',
      tipo: 'EXCLUSIVO',
      precioClp: 25_000,
      creditosConsumidos: 25_000,
      proveedorNombre: 'Acme Aseo',
    })
    expect(toma.subject).toBe('Lead tomado: Empresas de aseo · exclusivo')
    expect(toma.text).toMatch(/Acme Aseo/)
    expect(toma.text).toMatch(/exclusivo/)
    expect(toma.text).toMatch(/25\.000|25000/)
  })
})

describe('avisarAdmin fail-soft y dedup', () => {
  it('creación VERIFICADO usa admin:lead:{id}:VERIFICADO y no el corto', async () => {
    const enviar = vi.fn(async () => ({ ok: true as const }))
    await avisarAdminLeadCreado('lead-v', {
      enviar,
      cargarLead: async () => ({ ...leadAdmin, estado: 'VERIFICADO' }),
    })
    expect(enviar).toHaveBeenCalledTimes(1)
    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ADMIN_AVISO_EMAIL_DEFAULT,
        subject: 'Nueva cotización: Servicio de seguridad en Providencia',
        idempotencyKey: 'admin:lead:lead-v:VERIFICADO',
      }),
    )
  })

  it('creación pendiente y verificación posterior son dos keys distintas', async () => {
    const enviar = vi.fn(async () => ({ ok: true as const }))
    await avisarAdminLeadCreado('lead-p', { enviar, cargarLead: async () => leadAdmin })
    await avisarAdminLeadVerificado('lead-p', { enviar, cargarLead: async () => leadAdmin })
    expect(enviar).toHaveBeenCalledTimes(2)
    expect(enviar).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ idempotencyKey: 'admin:lead:lead-p:RECIBIDO' }),
    )
    expect(enviar).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idempotencyKey: 'admin:lead:lead-p:VERIFICADO',
        subject: expect.stringMatching(/verificada/i),
      }),
    )
  })

  it('omite Gard y no llama a enviarCorreo', async () => {
    const enviar = vi.fn(async () => ({ ok: true as const }))
    await avisarAdminAltaProveedor('gard-1', {
      enviar,
      cargarProveedor: async () => ({
        slug: 'gard-security',
        nombre: 'Gard Security',
        razonSocial: 'Gard Security',
        rutNormalizado: '77840623-3',
        email: 'gard@example.com',
        telefonoE164: '+56900000000',
      }),
    })
    expect(enviar).not.toHaveBeenCalled()
  })

  it('enviarCorreo en reject no lanza desde avisarAdmin', async () => {
    const enviar = vi.fn(async () => {
      throw new Error('resend caído')
    })
    await expect(
      avisarAdminLeadCreado('lead-x', { enviar, cargarLead: async () => leadAdmin }),
    ).resolves.toBeUndefined()
    await expect(
      avisarAdminLeadVerificado('lead-x', { enviar, cargarLead: async () => leadAdmin }),
    ).resolves.toBeUndefined()
    await expect(
      avisarAdminAltaProveedor('prov-x', {
        enviar,
        cargarProveedor: async () => ({
          slug: 'prov-1',
          nombre: 'Acme',
          razonSocial: 'Acme SpA',
          rutNormalizado: '76777530-8',
          email: 'ok@acme.cl',
          telefonoE164: '+56911111111',
        }),
      }),
    ).resolves.toBeUndefined()
    await expect(
      avisarAdminCompraPagada(
        { leadId: 'l1', compraId: 'c1' },
        {
          enviar,
          cargarCompra: async () => ({
            rubro: 'Servicio de seguridad',
            comuna: 'Providencia',
            tipo: 'COMPARTIDO',
            precioClp: 20_000,
            creditosConsumidos: 20_000,
            proveedorNombre: 'Acme',
          }),
        },
      ),
    ).resolves.toBeUndefined()
    expect(enviar).toHaveBeenCalled()
  })

  it('los ganchos viven en create, OTP, alta y CompraLead PAGADA', () => {
    const leer = (archivo: string) => readFileSync(resolve(process.cwd(), archivo), 'utf8')
    expect(leer('src/server/leads.ts')).toContain('avisarAdminLeadCreado')
    expect(leer('src/server/leads.ts')).not.toContain('avisarAdminLeadVerificado')
    expect(leer('src/server/otp.ts')).toContain('avisarAdminLeadVerificado')
    expect(leer('src/server/otp.ts')).toContain('avisarAdminAltaProveedor')
    expect(leer('src/server/otp.ts')).toContain('recienAprobado')
    expect(leer('src/server/marketplace.ts')).toContain('avisarAdminCompraPagada')
    expect(leer('src/server/gard.ts')).not.toContain('avisarAdminAltaProveedor')
    expect(leer('src/lib/gard.ts')).not.toContain('avisarAdminAltaProveedor')
  })
})
