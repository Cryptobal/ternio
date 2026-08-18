import { EstadoCompraLead, EstadoLead } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import {
  contarComprasPagadas,
  recapDatosComprador,
  resumenCotizacionComprador,
  textoEmpresasTomaron,
} from '@/lib/estado-comprador'

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
    expect(resumen.siguiente).toBeUndefined()
    expect(JSON.stringify(resumen)).not.toMatch(/te van a contactar 5|propuesta/i)
  })
})

describe('recap del comprador', () => {
  it('cuenta solo compras PAGADA', () => {
    expect(
      contarComprasPagadas([
        { estado: EstadoCompraLead.PAGADA },
        { estado: EstadoCompraLead.PAGADA },
        { estado: EstadoCompraLead.REVERSADA },
      ]),
    ).toBe(2)
    expect(contarComprasPagadas([{ estado: 'REVERSADA' }])).toBe(0)
    expect(contarComprasPagadas([])).toBe(0)
  })

  it('habla en honesto: 0, 1 o N empresas, sin inventar contactos', () => {
    expect(textoEmpresasTomaron(0)).toBe('Todavía ninguna empresa tomó esta solicitud')
    expect(textoEmpresasTomaron(1)).toBe('1 empresa ya tiene tus datos')
    expect(textoEmpresasTomaron(2)).toBe('2 empresas ya tienen tus datos')
    expect(textoEmpresasTomaron(5)).toBe('5 empresas ya tienen tus datos')
    expect(textoEmpresasTomaron(5)).not.toMatch(/te contactaron 5/i)
  })

  it('resume Lead.datos y omite PII de contacto', () => {
    const recap = recapDatosComprador(
      {
        tipo_servicio: 'guardias',
        cantidad_guardias: '2',
        rut: '76.123.456-0',
        telefono: '+56911111111',
        email: 'ana@empresa.cl',
        razonSocial: 'Acme SpA',
        detalle: 'llamar al gerencia',
      },
      [
        {
          nombre: 'tipo_servicio',
          etiqueta: '¿Qué servicio necesitas?',
          tipo: 'select',
          requerido: true,
          opciones: [{ valor: 'guardias', etiqueta: 'Guardias de seguridad' }],
        },
        {
          nombre: 'cantidad_guardias',
          etiqueta: '¿Cuántas personas necesitas?',
          tipo: 'numero',
          requerido: false,
        },
      ],
    )

    expect(recap).toEqual([
      { etiqueta: '¿Qué servicio necesitas?', valor: 'Guardias de seguridad' },
      { etiqueta: '¿Cuántas personas necesitas?', valor: '2' },
    ])
    expect(JSON.stringify(recap)).not.toMatch(/76\.123|569111|ana@|Acme|gerencia/)
  })
})
