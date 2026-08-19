import { describe, expect, it } from 'vitest'

import {
  DESCRIPCION_MAX,
  monogramaProveedor,
  normalizarDescripcion,
  normalizarSitioWeb,
  pathPublicoEmpresa,
  validarArchivoLogo,
} from '@/lib/logo-proveedor'

describe('logo-proveedor', () => {
  it('monograma toma iniciales', () => {
    expect(monogramaProveedor('Gard Security')).toBe('GS')
    expect(monogramaProveedor('Acme')).toBe('AC')
    expect(monogramaProveedor('  ')).toBe('?')
  })

  it('path público de empresa', () => {
    expect(pathPublicoEmpresa('Gard-Security')).toBe('/empresa/gard-security')
  })

  it('normaliza sitio web y descripción', () => {
    const web = normalizarSitioWeb('gard.cl')
    expect(web.ok).toBe(true)
    if (web.ok) expect(web.url).toBe('https://gard.cl/')
    expect(normalizarSitioWeb('ftp://x').ok).toBe(false)
    const desc = normalizarDescripcion('  Hola   mundo ')
    expect(desc.ok).toBe(true)
    if (desc.ok) expect(desc.texto).toBe('Hola mundo')
    expect(normalizarDescripcion('x'.repeat(DESCRIPCION_MAX + 1)).ok).toBe(false)
  })

  it('valida archivo de logo', () => {
    expect(validarArchivoLogo({ type: 'image/png', size: 100 }).ok).toBe(true)
    expect(validarArchivoLogo({ type: 'image/gif', size: 100 }).ok).toBe(false)
    expect(validarArchivoLogo({ type: 'image/png', size: 2_000_000 }).ok).toBe(false)
  })
})
