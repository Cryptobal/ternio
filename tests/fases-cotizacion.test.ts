import { describe, expect, it } from 'vitest'

import type { CampoFormulario } from '@/lib/campos'
import {
  faseActivaDe,
  faseDePaso,
  progresoFases,
  progresoSelectorNecesidad,
} from '@/lib/fases-cotizacion'
import { construirPasos } from '@/lib/pasos-cotizacion'

const CUATRO: CampoFormulario[] = [
  {
    nombre: 'tipo',
    etiqueta: 'Tipo',
    tipo: 'select',
    requerido: true,
    opciones: [{ valor: 'a', etiqueta: 'A' }],
  },
  { nombre: 'c2', etiqueta: 'C2', tipo: 'texto', requerido: false },
  { nombre: 'c3', etiqueta: 'C3', tipo: 'texto', requerido: false },
  { nombre: 'c4', etiqueta: 'C4', tipo: 'texto', requerido: false },
]

describe('faseDePaso', () => {
  it('mapea los cuatro tipos de paso', () => {
    const conComuna = construirPasos(CUATRO, { pideComuna: true })
    expect(faseDePaso(conComuna[0]!)).toBe('necesidad')
    expect(faseDePaso(conComuna[1]!)).toBe('detalles')
    const razon = conComuna.find((p) => p.id === 'razonSocial')!
    expect(faseDePaso(razon)).toBe('datos')
    const envio = conComuna.find((p) => p.tipo === 'envio')!
    expect(faseDePaso(envio)).toBe('datos')
  })
})

describe('progresoFases', () => {
  it('rubro sin campos: detalles al 100 % y no divide por cero', () => {
    const pasos = construirPasos([], { pideComuna: false })
    const tramos = progresoFases(pasos, 0, { necesidadPrevia: true })
    expect(tramos.map((t) => t.completo)).toEqual([1, 1, 0])
    expect(faseActivaDe(tramos)).toBe('datos')
  })

  it('tabla 5.3: llegada con comuna y 4 campos → Detalles al 0 %', () => {
    const pasos = construirPasos(CUATRO, { pideComuna: false })
    const tramos = progresoFases(pasos, 0, { necesidadPrevia: true })
    expect(tramos.map((t) => Math.round(t.completo * 100))).toEqual([100, 0, 0])
    expect(faseActivaDe(tramos)).toBe('detalles')
  })

  it('tabla 5.3: respondió 2 de 4 campos del rubro → 50 % detalles', () => {
    const pasos = construirPasos(CUATRO, { pideComuna: false })
    // Índice 2 = tercer campo → 2 hechos
    const tramos = progresoFases(pasos, 2, { necesidadPrevia: true })
    expect(tramos.map((t) => Math.round(t.completo * 100))).toEqual([100, 50, 0])
    expect(faseActivaDe(tramos)).toBe('detalles')
  })

  it('tabla 5.3: escribiendo el RUT (2.º de 6 de datos) → ~17 %', () => {
    const pasos = construirPasos(CUATRO, { pideComuna: false })
    const idxRut = pasos.findIndex((p) => p.id === 'rut')
    const tramos = progresoFases(pasos, idxRut, { necesidadPrevia: true })
    expect(tramos[0]!.completo).toBe(1)
    expect(tramos[1]!.completo).toBe(1)
    expect(Math.round(tramos[2]!.completo * 100)).toBe(17)
    expect(faseActivaDe(tramos)).toBe('datos')
  })

  it('sin necesidadPrevia: comuna cuenta en fase 1', () => {
    const pasos = construirPasos(CUATRO, { pideComuna: true })
    const enComuna = progresoFases(pasos, 0, { necesidadPrevia: false })
    expect(enComuna.map((t) => Math.round(t.completo * 100))).toEqual([0, 0, 0])
    expect(faseActivaDe(enComuna)).toBe('necesidad')

    const trasComuna = progresoFases(pasos, 1, { necesidadPrevia: false })
    expect(trasComuna.map((t) => Math.round(t.completo * 100))).toEqual([100, 0, 0])
    expect(faseActivaDe(trasComuna)).toBe('detalles')
  })

  it('necesidadPrevia false con 0 campos y sin comuna en pasos', () => {
    const pasos = construirPasos([], { pideComuna: false })
    const tramos = progresoFases(pasos, 0, { necesidadPrevia: false })
    expect(tramos[0]!.completo).toBe(0)
    expect(tramos[1]!.completo).toBe(1)
  })
})

describe('progresoSelectorNecesidad', () => {
  it('tabla 5.3 del selector home', () => {
    expect(progresoSelectorNecesidad('', '', '').map((t) => Math.round(t.completo * 100))).toEqual([
      0, 0, 0,
    ])
    expect(
      progresoSelectorNecesidad('empresa', '', '').map((t) => Math.round(t.completo * 100)),
    ).toEqual([33, 0, 0])
    expect(
      progresoSelectorNecesidad('empresa', 'seguridad', '').map((t) => Math.round(t.completo * 100)),
    ).toEqual([67, 0, 0])
    expect(
      progresoSelectorNecesidad('empresa', 'seguridad', 'las-condes').map((t) =>
        Math.round(t.completo * 100),
      ),
    ).toEqual([100, 0, 0])
    expect(faseActivaDe(progresoSelectorNecesidad('empresa', 'seguridad', 'las-condes'))).toBe(
      'detalles',
    )
  })
})
