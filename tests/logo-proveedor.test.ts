import { describe, expect, it } from 'vitest'

import {
  DESCRIPCION_MAX,
  accesoBlobLogo,
  blobConfigurado,
  esLogoBlobPrivado,
  esUrlBlobVercel,
  monogramaProveedor,
  normalizarDescripcion,
  normalizarSitioWeb,
  pathPublicoEmpresa,
  urlLogoVisible,
  validarArchivoLogo,
  mensajeErrorSubidaLogo,
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

  it('detecta blob configurado con token o store id', () => {
    expect(blobConfigurado('vercel_blob_rw_x')).toBe(true)
    expect(blobConfigurado(undefined, 'store_abc')).toBe(true)
    expect(blobConfigurado('', '')).toBe(false)
  })

  it('respeta BLOB_ACCESS para el modo del store', () => {
    expect(accesoBlobLogo('private')).toBe('private')
    expect(accesoBlobLogo('PUBLIC')).toBe('public')
    expect(accesoBlobLogo(undefined)).toBe('public')
  })

  it('proxy para logos en blob privado', () => {
    const privada =
      'https://npuwvv4p0k.public.blob.vercel-storage.com/x-y.png'.replace('.public.', '.private.')
    expect(esLogoBlobPrivado(privada)).toBe(true)
    expect(urlLogoVisible(privada)).toContain('/api/blob-marca?u=')
    expect(urlLogoVisible('https://cdn.example/logo.png')).toBe('https://cdn.example/logo.png')
  })

  it('reconoce URLs de blob vercel', () => {
    expect(esUrlBlobVercel('https://abc.public.blob.vercel-storage.com/x.png')).toBe(true)
    expect(esUrlBlobVercel('https://abc.private.blob.vercel-storage.com/x.png')).toBe(true)
    expect(esUrlBlobVercel('https://example.com/x.png')).toBe(false)
  })
})

describe('mensajeErrorSubidaLogo', () => {
  it('traduce errores conocidos de Blob', () => {
    expect(mensajeErrorSubidaLogo(new Error('Vercel Blob: Access denied'))).toContain('token')
    expect(mensajeErrorSubidaLogo(new Error('Vercel Blob: OIDC is enabled for this project'))).toContain('OIDC')
  })
})
