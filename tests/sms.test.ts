import { afterEach, describe, expect, it, vi } from 'vitest'

import { enviarSms, smsConfigurado } from '@/lib/sms'

describe('sms', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
    vi.unstubAllGlobals()
  })

  it('sin credenciales no está configurado', () => {
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_FROM
    expect(smsConfigurado()).toBe(false)
  })

  it('en producción sin credenciales falla cerrado', async () => {
    delete process.env.TWILIO_ACCOUNT_SID
    vi.stubEnv('NODE_ENV', 'production')
    const resultado = await enviarSms('+56911111111', 'código')
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.motivo).toMatch(/reintenta/)
  })
})
