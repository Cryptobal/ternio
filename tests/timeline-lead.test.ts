import { EstadoLead } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import { hitosTimelineLead } from '@/lib/timeline-lead'

describe('hitosTimelineLead', () => {
  it('muestra verificación pendiente cuando falta el teléfono', () => {
    const hitos = hitosTimelineLead({
      estado: EstadoLead.RECIBIDO,
      rutValido: true,
      telefonoVerificado: false,
    })
    expect(hitos[1]?.estado).toBe('actual')
    expect(hitos[1]?.detalle).toMatch(/Teléfono pendiente/)
  })

  it('marca verificado cuando el estado real es VERIFICADO', () => {
    const hitos = hitosTimelineLead({
      estado: EstadoLead.VERIFICADO,
      rutValido: true,
      telefonoVerificado: true,
    })
    expect(hitos[1]?.estado).toBe('hecho')
    expect(hitos[2]?.titulo).toMatch(/contacten/)
  })
})
