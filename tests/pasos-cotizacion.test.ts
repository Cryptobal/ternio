import { describe, expect, it } from 'vitest'

import type { CampoFormulario } from '@/lib/campos'
import {
  avanzaSoloAlElegir,
  construirPasos,
  errorDePaso,
  etiquetaAvancePaso,
  mostrarBotonAvance,
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
      rut: '76.482.113-0',
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

  it('no deja avanzar un paso requerido vacío o un RUT con DV incorrecto', () => {
    const pasos = construirPasos(CAMPOS, { pideComuna: true })
    const comuna = pasos.find((paso) => paso.tipo === 'comuna')
    const cantidad = pasos.find((paso) => paso.id === 'cantidad')
    const razon = pasos.find((paso) => paso.id === 'razonSocial')
    const rut = pasos.find((paso) => paso.id === 'rut')
    const nombre = pasos.find((paso) => paso.id === 'nombreContacto')
    const telefono = pasos.find((paso) => paso.id === 'telefono')
    const email = pasos.find((paso) => paso.id === 'email')

    expect(comuna && errorDePaso(comuna, {})).toMatch(/comuna/i)
    expect(cantidad && errorDePaso(cantidad, {})).toBeUndefined()
    expect(razon && errorDePaso(razon, { razonSocial: '' })).toMatch(/razón social/i)
    expect(rut && errorDePaso(rut, { rut: '12.345.678-4' })).toMatch(/dígito verificador/i)
    expect(rut && errorDePaso(rut, { rut: '12.345.678-5' })).toBeUndefined()
    expect(nombre && errorDePaso(nombre, { nombreContacto: '   ' })).toMatch(/nombre/i)
    expect(telefono && errorDePaso(telefono, { telefono: '223456789' })).toMatch(/celular/i)
    expect(telefono && errorDePaso(telefono, { telefono: '+56 9 1234 5678' })).toBeUndefined()
    expect(email && errorDePaso(email, { email: 'no-es-correo' })).toMatch(/correo/i)
    expect(email && errorDePaso(email, { email: 'ana@gmail.com' })).toBeUndefined()
  })

  it('en un paso opcional vacío el botón dice Saltar; la identidad nunca se salta', () => {
    const pasos = construirPasos(CAMPOS, { pideComuna: false })
    const cantidad = pasos.find((paso) => paso.id === 'cantidad')
    const razon = pasos.find((paso) => paso.id === 'razonSocial')
    const tipo = pasos.find((paso) => paso.id === 'tipo_servicio')

    expect(cantidad && etiquetaAvancePaso(cantidad, {})).toBe('Saltar')
    expect(cantidad && mostrarBotonAvance(cantidad, {})).toBe(true)
    expect(cantidad && errorDePaso(cantidad, {})).toBeUndefined()

    expect(razon && etiquetaAvancePaso(razon, { razonSocial: '' })).toBe('Continuar')
    expect(razon && errorDePaso(razon, { razonSocial: '' })).toMatch(/razón social/i)
    expect(razon && errorDePaso(razon, {})).toMatch(/razón social/i)

    expect(tipo && avanzaSoloAlElegir(tipo)).toBe(true)
    expect(tipo && mostrarBotonAvance(tipo, {})).toBe(false)
  })

  it('conserva las respuestas al reconstruir el payload después de navegar', () => {
    const ida = { tipo_servicio: 'guardias', cantidad: '2' }
    const vuelta = { ...ida, rut: '76482113-5' }
    expect(payloadDesdeValores(vuelta, { rubro: 'seguridad', comuna: 'las-condes' })).toMatchObject(
      ida,
    )
  })
})
