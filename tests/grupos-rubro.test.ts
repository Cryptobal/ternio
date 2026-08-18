import { describe, expect, it } from 'vitest'

import { agruparPorGrupo, grupoRubro, SLUGS_OLA2 } from '@/lib/grupos-rubro'

describe('grupos livianos del cotizador', () => {
  it('ordena Hogar / Empresa / Asesoría y no inventa un segundo producto', () => {
    expect(grupoRubro('gasfiteria')).toBe('hogar')
    expect(grupoRubro('seguridad')).toBe('empresa')
    expect(grupoRubro('asesoria-financiera')).toBe('asesoria')
    expect(SLUGS_OLA2).toHaveLength(17)
    const grupos = agruparPorGrupo([
      { slug: 'seguridad' },
      { slug: 'gasfiteria' },
      { slug: 'seguros' },
    ])
    expect(grupos.map((grupo) => grupo.id)).toEqual(['hogar', 'empresa', 'asesoria'])
  })
})
