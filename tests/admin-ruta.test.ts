import { describe, expect, it } from 'vitest'

import { decidirAccesoAdmin } from '@/lib/admin-ruta'

const ADMIN_PATH = 'ruta-larga-y-secreta'

describe('decidirAccesoAdmin', () => {
  it('deja pasar al ADMIN por la ruta secreta', () => {
    expect(
      decidirAccesoAdmin({ pathname: `/${ADMIN_PATH}`, adminPath: ADMIN_PATH, esAdmin: true }),
    ).toBe('permitir')
    expect(
      decidirAccesoAdmin({
        pathname: `/${ADMIN_PATH}/leads/abc123`,
        adminPath: ADMIN_PATH,
        esAdmin: true,
      }),
    ).toBe('permitir')
  })

  it('responde 404 en la ruta secreta cuando no hay rol ADMIN', () => {
    expect(
      decidirAccesoAdmin({ pathname: `/${ADMIN_PATH}`, adminPath: ADMIN_PATH, esAdmin: false }),
    ).toBe('no-encontrado')
    expect(
      decidirAccesoAdmin({
        pathname: `/${ADMIN_PATH}/demanda`,
        adminPath: ADMIN_PATH,
        esAdmin: false,
      }),
    ).toBe('no-encontrado')
  })

  it('responde 404 al acceso directo a /admin, incluso siendo ADMIN', () => {
    expect(decidirAccesoAdmin({ pathname: '/admin', adminPath: ADMIN_PATH, esAdmin: true })).toBe(
      'no-encontrado',
    )
    expect(
      decidirAccesoAdmin({
        pathname: '/admin/leads/abc123',
        adminPath: ADMIN_PATH,
        esAdmin: true,
      }),
    ).toBe('no-encontrado')
  })

  it('deja alcanzable el login para que el dueño pueda entrar', () => {
    expect(
      decidirAccesoAdmin({
        pathname: `/${ADMIN_PATH}/ingresar`,
        adminPath: ADMIN_PATH,
        esAdmin: false,
      }),
    ).toBe('permitir')
  })

  it('deja el panel inalcanzable si no hay ADMIN_PATH configurado', () => {
    expect(decidirAccesoAdmin({ pathname: '/admin', adminPath: '', esAdmin: true })).toBe(
      'no-encontrado',
    )
    expect(decidirAccesoAdmin({ pathname: '/cualquier-cosa', adminPath: undefined, esAdmin: true })).toBe(
      'ignorar',
    )
  })

  it('al rotar ADMIN_PATH la ruta anterior deja de servir', () => {
    expect(
      decidirAccesoAdmin({ pathname: '/ruta-vieja', adminPath: ADMIN_PATH, esAdmin: true }),
    ).toBe('ignorar')
  })

  it('no confunde rutas públicas con la ruta secreta', () => {
    expect(
      decidirAccesoAdmin({ pathname: '/seguridad/las-condes', adminPath: ADMIN_PATH, esAdmin: false }),
    ).toBe('ignorar')
    // Un prefijo parecido no basta: tiene que ser el segmento completo.
    expect(
      decidirAccesoAdmin({
        pathname: `/${ADMIN_PATH}-falso`,
        adminPath: ADMIN_PATH,
        esAdmin: false,
      }),
    ).toBe('ignorar')
    // Tampoco un rubro que empiece con "admin".
    expect(
      decidirAccesoAdmin({ pathname: '/administracion-de-edificios', adminPath: ADMIN_PATH, esAdmin: false }),
    ).toBe('ignorar')
  })

  it('tolera ADMIN_PATH escrito con barras', () => {
    expect(
      decidirAccesoAdmin({ pathname: `/${ADMIN_PATH}`, adminPath: `/${ADMIN_PATH}/`, esAdmin: true }),
    ).toBe('permitir')
  })
})
