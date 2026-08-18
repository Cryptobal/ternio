import { describe, expect, it } from 'vitest'

import { decidirAccesoAdmin, rutaAdmin } from '@/lib/admin-ruta'

describe('decidirAccesoAdmin', () => {
  it('deja pasar al ADMIN por /admin', () => {
    expect(decidirAccesoAdmin({ pathname: '/admin', esAdmin: true })).toBe('permitir')
    expect(decidirAccesoAdmin({ pathname: '/admin/leads/abc123', esAdmin: true })).toBe(
      'permitir',
    )
  })

  it('responde 404 en /admin cuando no hay rol ADMIN', () => {
    expect(decidirAccesoAdmin({ pathname: '/admin', esAdmin: false })).toBe('no-encontrado')
    expect(decidirAccesoAdmin({ pathname: '/admin/demanda', esAdmin: false })).toBe(
      'no-encontrado',
    )
  })

  it('deja alcanzable el login para que el dueño pueda entrar', () => {
    expect(decidirAccesoAdmin({ pathname: '/admin/ingresar', esAdmin: false })).toBe('permitir')
  })

  it('no confunde rutas públicas con /admin', () => {
    expect(
      decidirAccesoAdmin({ pathname: '/seguridad/las-condes', esAdmin: false }),
    ).toBe('ignorar')
    expect(decidirAccesoAdmin({ pathname: '/administracion-de-edificios', esAdmin: false })).toBe(
      'ignorar',
    )
    expect(decidirAccesoAdmin({ pathname: '/proveedores', esAdmin: false })).toBe('ignorar')
  })

  it('rutaAdmin apunta siempre a /admin', () => {
    expect(rutaAdmin()).toBe('/admin')
    expect(rutaAdmin('demanda')).toBe('/admin/demanda')
    expect(rutaAdmin('/leads/abc')).toBe('/admin/leads/abc')
  })
})
