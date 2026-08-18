import { describe, expect, it, beforeEach } from 'vitest'

import { consumirRateLimit, reiniciarRateLimit } from '@/lib/rate-limit'
import { EstadoProveedor, RolUsuario } from '@prisma/client'

/**
 * Reglas del login proveedor (espejo de `authorize` + action), sin Auth.js.
 * Cubren rechazo de ADMIN, SUSPENDIDO y rate limit por correo.
 */
function decidirLoginProveedor(args: {
  email: string
  passwordOk: boolean
  rol: string | null
  tienePassword: boolean
  estadoProveedor: string | null
  intentosPrevios?: number
}): { ok: boolean; motivo: 'ok' | 'credenciales' | 'suspendido' | 'rechazado' | 'rate' } {
  const limite = consumirRateLimit(`login-proveedor-test:${args.email}`, 5, 5 * 60_000)
  if (!limite.permitido) return { ok: false, motivo: 'rate' }

  if (
    !args.rol ||
    args.rol === RolUsuario.ADMIN ||
    !args.tienePassword ||
    !args.estadoProveedor
  ) {
    return { ok: false, motivo: 'credenciales' }
  }
  if (args.estadoProveedor === EstadoProveedor.SUSPENDIDO) {
    return { ok: false, motivo: 'suspendido' }
  }
  if (args.estadoProveedor === EstadoProveedor.RECHAZADO) {
    return { ok: false, motivo: 'rechazado' }
  }
  if (!args.passwordOk) return { ok: false, motivo: 'credenciales' }
  return { ok: true, motivo: 'ok' }
}

beforeEach(() => {
  reiniciarRateLimit()
})

describe('login proveedor (reglas)', () => {
  const base = {
    email: 'venta@empresa.cl',
    passwordOk: true,
    rol: RolUsuario.PROVEEDOR,
    tienePassword: true,
    estadoProveedor: EstadoProveedor.APROBADO,
  }

  it('acepta proveedor aprobado con contraseña', () => {
    expect(decidirLoginProveedor(base)).toEqual({ ok: true, motivo: 'ok' })
  })

  it('rechaza rol ADMIN aunque la contraseña calce', () => {
    expect(decidirLoginProveedor({ ...base, rol: RolUsuario.ADMIN })).toEqual({
      ok: false,
      motivo: 'credenciales',
    })
  })

  it('rechaza SUSPENDIDO con motivo explícito', () => {
    expect(
      decidirLoginProveedor({ ...base, estadoProveedor: EstadoProveedor.SUSPENDIDO }),
    ).toEqual({ ok: false, motivo: 'suspendido' })
  })

  it('frena tras 5 intentos por correo', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(decidirLoginProveedor({ ...base, passwordOk: false }).ok).toBe(false)
    }
    expect(decidirLoginProveedor({ ...base, passwordOk: true }).motivo).toBe('rate')
  })
})
