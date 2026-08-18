import { EstadoCompraLead, EstadoLead } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import { CAMPOS_SEGURIDAD } from '../prisma/catalogo-inicial'
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
    expect(resumen.siguiente ?? '').not.toMatch(/contacten|propuesta|5 empresas/i)
  })
})

describe('compras PAGADA para el recap del comprador', () => {
  it('cuenta solo PAGADA y no inventa contactos', () => {
    expect(
      contarComprasPagadas([
        { estado: EstadoCompraLead.PAGADA },
        { estado: EstadoCompraLead.REVERSADA },
        { estado: EstadoCompraLead.PAGADA },
      ]),
    ).toBe(2)
    expect(contarComprasPagadas([{ estado: EstadoCompraLead.REVERSADA }])).toBe(0)
    expect(textoEmpresasTomaron(0)).toBe('Todavía ninguna empresa tomó esta solicitud')
    expect(textoEmpresasTomaron(1)).toBe('1 empresa ya tiene tus datos')
    expect(textoEmpresasTomaron(2)).toBe('2 empresas ya tienen tus datos')
    expect(textoEmpresasTomaron(2)).not.toMatch(/contactaron|te van a/i)
  })
})

describe('recapDatosComprador', () => {
  it('resume Lead.datos con etiquetas y sin PII', () => {
    const lineas = recapDatosComprador(
      {
        tipo_servicio: 'guardias',
        horario: 'diurno',
        email: 'oculto@empresa.cl',
        telefono: '+56911111111',
        detalle: 'mi celular es 9 1111 1111',
      },
      CAMPOS_SEGURIDAD,
    )
    expect(lineas.map((linea) => linea.valor)).toContain('Guardias de seguridad')
    expect(lineas.map((linea) => linea.valor)).toContain('Turno de día')
    expect(JSON.stringify(lineas)).not.toMatch(/oculto@|1111 1111|\+569/)
  })
})
