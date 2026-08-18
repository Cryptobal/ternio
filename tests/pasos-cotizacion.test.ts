import { describe, expect, it } from 'vitest'

import type { CampoFormulario } from '@/lib/campos'
import {
  avanzaSoloAlElegir,
  construirPasos,
  payloadDesdeValores,
} from '@/lib/pasos-cotizacion'

const CAMPOS: CampoFormulario[] = [
  {
    nombre: 'tipo_servicio',
    etiqueta: 'Tipo',
    tipo: 'select',
    requerido: true,
    opciones: [{ valor: 'guardias', etiqueta: 'Guardias 24/7' }],
  },
  { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'numero', requerido: false },
]

describe('construirPasos', () => {
  it('pone el módulo primero, después el tronco y el envío', () => {
    const pasos = construirPasos(CAMPOS, { pideComuna: false })
    expect(pasos.map((paso) => paso.id)).toEqual([
      'tipo_servicio',
      'cantidad',
      'razonSocial',
      'rut',
      'nombreContacto',
      'telefono',
      'email',
      'envio',
    ])
  })

  it('agrega la comuna como primera pregunta si no viene en la URL', () => {
    const pasos = construirPasos(CAMPOS, { pideComuna: true })
    expect(pasos[0]).toMatchObject({ tipo: 'comuna', id: 'comuna' })
  })

  it('la opción única avanza sola; el número no', () => {
    const [tipo, cantidad] = construirPasos(CAMPOS, { pideComuna: false })
    expect(tipo && avanzaSoloAlElegir(tipo)).toBe(true)
    expect(cantidad && avanzaSoloAlElegir(cantidad)).toBe(false)
  })
})

describe('payloadDesdeValores', () => {
  it('arma el payload completo una sola vez con todas las respuestas', () => {
    const valores = {
      tipo_servicio: 'guardias',
      cantidad: '2',
      razonSocial: 'Ejemplo SpA',
      rut: '76.482.113-5',
      nombreContacto: 'Ana',
      telefono: '+56 9 8123 4567',
      email: 'ana@empresa.cl',
    }

    expect(payloadDesdeValores(valores, { rubro: 'seguridad', comuna: 'las-condes' })).toEqual({
      rubro: 'seguridad',
      comuna: 'las-condes',
      ...valores,
    })
  })

  it('conserva las respuestas al reconstruir el payload después de navegar', () => {
    const ida = { tipo_servicio: 'guardias', cantidad: '2' }
    const vuelta = { ...ida, rut: '76482113-5' }
    expect(payloadDesdeValores(vuelta, { rubro: 'seguridad', comuna: 'las-condes' })).toMatchObject(
      ida,
    )
  })
})
