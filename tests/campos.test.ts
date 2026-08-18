import { describe, expect, it, vi } from 'vitest'

import { parsearCampos, validarValoresCampos, type CampoFormulario } from '@/lib/campos'

const CAMPOS: CampoFormulario[] = [
  {
    nombre: 'tipo_servicio',
    etiqueta: 'Servicio',
    tipo: 'select',
    requerido: true,
    opciones: [
      { valor: 'guardias', etiqueta: 'Guardias' },
      { valor: 'rondas', etiqueta: 'Rondas' },
    ],
  },
  { nombre: 'cantidad', etiqueta: 'Cantidad', tipo: 'numero', requerido: false },
  { nombre: 'detalle', etiqueta: 'Detalle', tipo: 'textarea', requerido: false },
]

describe('parsearCampos', () => {
  it('no rompe la página pública si el JSON del rubro quedó mal editado', () => {
    expect(parsearCampos(null)).toEqual([])
    expect(parsearCampos('esto no es una lista')).toEqual([])
    expect(parsearCampos([{ nombre: 'MAYUSCULAS', etiqueta: 'x', tipo: 'texto' }])).toEqual([])
  })

  it('acepta una definición válida', () => {
    expect(parsearCampos(CAMPOS)).toHaveLength(3)
  })

  it('acepta opcion_multiple y si_no', () => {
    const campos = parsearCampos([
      {
        nombre: 'servicios',
        etiqueta: 'Servicios',
        tipo: 'opcion_multiple',
        requerido: true,
        opciones: [{ valor: 'a', etiqueta: 'A' }],
      },
      { nombre: 'urgente', etiqueta: '¿Es urgente?', tipo: 'si_no', requerido: true },
    ])
    expect(campos).toHaveLength(2)
  })

  it('si hay más de 6 preguntas, degrada al tronco y lo reporta', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const muchos = Array.from({ length: 7 }, (_, i) => ({
      nombre: `campo_${i}`,
      etiqueta: `Campo ${i}`,
      tipo: 'texto' as const,
      requerido: false,
    }))
    expect(parsearCampos(muchos)).toEqual([])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('validarValoresCampos', () => {
  it('acepta respuestas válidas', () => {
    const resultado = validarValoresCampos(CAMPOS, {
      tipo_servicio: 'guardias',
      cantidad: '3',
      detalle: '  Dos accesos  ',
    })

    expect(resultado).toEqual({
      ok: true,
      valores: { tipo_servicio: 'guardias', cantidad: '3', detalle: 'Dos accesos' },
    })
  })

  it('exige los campos requeridos', () => {
    const resultado = validarValoresCampos(CAMPOS, { cantidad: '3' })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.errores.tipo_servicio).toBeDefined()
  })

  it('rechaza una opción que no está en la configuración del rubro', () => {
    const resultado = validarValoresCampos(CAMPOS, { tipo_servicio: 'lo-que-sea' })
    expect(resultado.ok).toBe(false)
  })

  it('rechaza texto en un campo numérico', () => {
    const resultado = validarValoresCampos(CAMPOS, {
      tipo_servicio: 'guardias',
      cantidad: 'muchos',
    })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.errores.cantidad).toBeDefined()
  })

  it('descarta cualquier clave que el rubro no declara', () => {
    const resultado = validarValoresCampos(CAMPOS, {
      tipo_servicio: 'guardias',
      campo_inventado: 'valor colado desde el navegador',
    })

    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.valores).not.toHaveProperty('campo_inventado')
  })

  it('corta respuestas absurdamente largas', () => {
    const resultado = validarValoresCampos(CAMPOS, {
      tipo_servicio: 'guardias',
      detalle: 'a'.repeat(2001),
    })
    expect(resultado.ok).toBe(false)
  })

  it('acepta varias opciones en opcion_multiple', () => {
    const campos: CampoFormulario[] = [
      {
        nombre: 'servicios',
        etiqueta: 'Servicios',
        tipo: 'opcion_multiple',
        requerido: true,
        opciones: [
          { valor: 'a', etiqueta: 'A' },
          { valor: 'b', etiqueta: 'B' },
        ],
      },
    ]
    expect(validarValoresCampos(campos, { servicios: ['a', 'b'] })).toEqual({
      ok: true,
      valores: { servicios: 'a,b' },
    })
    expect(validarValoresCampos(campos, { servicios: 'c' }).ok).toBe(false)
  })

  it('acepta sí/no', () => {
    const campos: CampoFormulario[] = [
      { nombre: 'urgente', etiqueta: '¿Urgente?', tipo: 'si_no', requerido: true },
    ]
    expect(validarValoresCampos(campos, { urgente: 'si' }).ok).toBe(true)
    expect(validarValoresCampos(campos, { urgente: 'tal_vez' }).ok).toBe(false)
  })
})
