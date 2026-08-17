import { describe, expect, it } from 'vitest'

import { hashPassword, verificarPassword } from '@/lib/password'

describe('hash de la contraseña del admin', () => {
  it('acepta la contraseña correcta y rechaza cualquier otra', async () => {
    const hash = await hashPassword('una-contraseña-larga-de-prueba')

    expect(await verificarPassword('una-contraseña-larga-de-prueba', hash)).toBe(true)
    expect(await verificarPassword('otra-contraseña', hash)).toBe(false)
    expect(await verificarPassword('', hash)).toBe(false)
  })

  it('usa sal: dos hashes de la misma contraseña son distintos', async () => {
    const uno = await hashPassword('misma-contraseña-larga')
    const otro = await hashPassword('misma-contraseña-larga')

    expect(uno).not.toBe(otro)
    expect(await verificarPassword('misma-contraseña-larga', uno)).toBe(true)
    expect(await verificarPassword('misma-contraseña-larga', otro)).toBe(true)
  })

  it('no guarda la contraseña en claro', async () => {
    const hash = await hashPassword('contraseña-secreta-larga')
    expect(hash).not.toContain('contraseña-secreta-larga')
    expect(hash.startsWith('scrypt$')).toBe(true)
  })

  it('rechaza un hash ausente o corrupto sin lanzar', async () => {
    expect(await verificarPassword('lo-que-sea', null)).toBe(false)
    expect(await verificarPassword('lo-que-sea', undefined)).toBe(false)
    expect(await verificarPassword('lo-que-sea', 'no-es-un-hash')).toBe(false)
    expect(await verificarPassword('lo-que-sea', 'scrypt$a$b$c$d$e')).toBe(false)
  })
})
