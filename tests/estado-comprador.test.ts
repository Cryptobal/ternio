import { EstadoLead } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import { resumenCotizacionComprador } from '@/lib/estado-comprador'

describe('resumenCotizacionComprador', () => {
  it('pide confirmar el teléfono si falta, sin inventar propuestas', () => {
    const resumen = resumenCotizacionComprador({
      estado: EstadoLead.RECIBIDO,
      rutValido: true,
      telefonoVerificado: false,
    })
    expect(resumen.estado).toMatch(/Recibimos/)
    expect(resumen.siguiente).toMatch(/teléfono/)
    expect(JSON.stringify(resumen)).not.toMatch(/propuesta|contacten|tres empresas/i)
  })

  it('no promete que empresas van a tomar la solicitud verificada', () => {
    const resumen = resumenCotizacionComprador({
      estado: EstadoLead.VERIFICADO,
      rutValido: true,
      telefonoVerificado: true,
    })
    expect(resumen.estado).toBe('Solicitud verificada')
    expect(resumen.siguiente).toMatch(/Aún no enviamos/)
    expect(resumen.siguiente).not.toMatch(/contacten|propuesta/i)
  })
})
