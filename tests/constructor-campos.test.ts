import { describe, expect, it } from 'vitest'

import { camposFormularioSchema } from '@/lib/campos'
import {
  campoVacio,
  diagnosticoCamposAlmacenados,
  duplicar,
  limpiarCampoParaPersistir,
  mover,
  nombreSugerido,
  nombresDuplicados,
  puedeAgregar,
  serializarCamposConstructor,
  valorSugerido,
  validarCamposConstructor,
  type DiagnosticoCamposAlmacenados,
} from '@/lib/constructor-campos'
import type { CampoFormulario } from '@/lib/campos'

function campo(parcial: Partial<CampoFormulario> & Pick<CampoFormulario, 'nombre'>): CampoFormulario {
  return {
    etiqueta: parcial.etiqueta ?? parcial.nombre,
    tipo: parcial.tipo ?? 'texto',
    requerido: parcial.requerido ?? false,
    ...parcial,
  }
}

describe('nombreSugerido', () => {
  it('normaliza tildes, ñ, mayúsculas y espacios', () => {
    expect(nombreSugerido('¿Cuántos guardias necesitas?', [])).toBe('cuantos_guardias_necesitas')
    expect(nombreSugerido('Tamaño del negocio', [])).toBe('tamano_del_negocio')
    expect(nombreSugerido('AÑO fiscal', [])).toBe('ano_fiscal')
  })

  it('cae a campo_N si solo hay signos', () => {
    expect(nombreSugerido('¿?', [])).toBe('campo_1')
    expect(nombreSugerido('¿?', ['campo_1'])).toBe('campo_2')
    expect(nombreSugerido('', [])).toBe('campo_1')
  })

  it('sufija ante colisiones', () => {
    expect(nombreSugerido('Cantidad', ['cantidad'])).toBe('cantidad_2')
    expect(nombreSugerido('Cantidad', ['cantidad', 'cantidad_2'])).toBe('cantidad_3')
  })
})

describe('valorSugerido', () => {
  it('propone valor y evita colisiones', () => {
    expect(valorSugerido('Guardias armados', [])).toBe('guardias_armados')
    expect(valorSugerido('Guardias armados', ['guardias_armados'])).toBe('guardias_armados_2')
  })
})

describe('mover / duplicar / puedeAgregar', () => {
  const lista = [
    campo({ nombre: 'a', etiqueta: 'A' }),
    campo({ nombre: 'b', etiqueta: 'B' }),
    campo({ nombre: 'c', etiqueta: 'C' }),
  ]

  it('mover respeta los bordes', () => {
    expect(mover(lista, 0, 'arriba').map((c) => c.nombre)).toEqual(['a', 'b', 'c'])
    expect(mover(lista, 2, 'abajo').map((c) => c.nombre)).toEqual(['a', 'b', 'c'])
    expect(mover(lista, 1, 'arriba').map((c) => c.nombre)).toEqual(['b', 'a', 'c'])
    expect(mover(lista, 0, 'abajo').map((c) => c.nombre)).toEqual(['b', 'a', 'c'])
  })

  it('duplicar genera nombre único y no pasa de 6', () => {
    const dup = duplicar(lista, 0)
    expect(dup).toHaveLength(4)
    expect(dup[1]?.nombre).not.toBe('a')
    expect(nombresDuplicados(dup).size).toBe(0)

    const seis = Array.from({ length: 6 }, (_, i) => campo({ nombre: `c_${i}` }))
    expect(puedeAgregar(seis)).toBe(false)
    expect(duplicar(seis, 0)).toHaveLength(6)
  })

  it('puedeAgregar es falso con 6', () => {
    expect(puedeAgregar([])).toBe(true)
    expect(puedeAgregar(Array.from({ length: 6 }, (_, i) => ({ n: i })))).toBe(false)
  })
})

describe('validar y serializar', () => {
  it('todo array limpio pasa el schema', () => {
    const campos: CampoFormulario[] = [
      campo({
        nombre: 'tipo',
        etiqueta: 'Tipo',
        tipo: 'select',
        requerido: true,
        opciones: [{ valor: 'a', etiqueta: 'A' }],
      }),
      campo({ nombre: 'detalle', etiqueta: 'Detalle', tipo: 'textarea', placeholder: '…' }),
      campo({ nombre: 'urgente', etiqueta: '¿Urgente?', tipo: 'si_no', requerido: true }),
    ]
    const limpios = campos.map(limpiarCampoParaPersistir)
    expect(camposFormularioSchema.safeParse(limpios).success).toBe(true)
    expect(camposFormularioSchema.safeParse(JSON.parse(serializarCamposConstructor(campos))).success).toBe(
      true,
    )
  })

  it('marca exceso y nombres duplicados', () => {
    const muchos = Array.from({ length: 7 }, (_, i) =>
      campo({ nombre: `campo_${i}`, etiqueta: `Campo ${i}` }),
    )
    const v = validarCamposConstructor(muchos)
    expect(v.ok).toBe(false)
    expect(v.exceso).toBe(true)

    const dup = validarCamposConstructor([
      campo({ nombre: 'x', etiqueta: 'Uno' }),
      campo({ nombre: 'x', etiqueta: 'Dos' }),
    ])
    expect(dup.ok).toBe(false)
    expect(dup.dupes.has('x')).toBe(true)
  })

  it('campoVacio propone nombre único', () => {
    const c = campoVacio(['nueva_pregunta'])
    expect(c.nombre).not.toBe('nueva_pregunta')
  })
})

describe('diagnosticoCamposAlmacenados', () => {
  it('ok con lista válida', () => {
    const d = diagnosticoCamposAlmacenados([
      { nombre: 'a', etiqueta: 'A', tipo: 'texto', requerido: false },
    ])
    expect(d.estado).toBe('ok')
    if (d.estado === 'ok') expect(d.campos).toHaveLength(1)
  })

  it('marca inválido por schema o exceso', () => {
    const malo = diagnosticoCamposAlmacenados([{ nombre: 'MAYUS', etiqueta: 'x', tipo: 'texto' }])
    expect(malo.estado).toBe('invalido')
    if (malo.estado === 'invalido') {
      expect(malo.motivo).toBe('schema')
      expect(malo.campos).toEqual([])
    }

    const muchos = Array.from({ length: 7 }, (_, i) => ({
      nombre: `campo_${i}`,
      etiqueta: `Campo ${i}`,
      tipo: 'texto',
      requerido: false,
    }))
    const exceso = diagnosticoCamposAlmacenados(muchos) as Extract<
      DiagnosticoCamposAlmacenados,
      { estado: 'invalido' }
    >
    expect(exceso.estado).toBe('invalido')
    expect(exceso.motivo).toBe('exceso')
    expect(exceso.campos).toHaveLength(7)
  })
})
