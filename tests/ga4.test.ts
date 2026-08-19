import { generateKeyPairSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  cargarTraficoGa4,
  desconectadoGa4,
  fechaCivilSantiago,
  firmarJwtServicio,
  mapearReporteLandings,
  mapearReporteTotales,
  MOTIVO_GA4,
  parsearPropertyId,
  parsearServiceAccountJson,
  rangoFechasGa4,
  SCOPE_GA4,
  textoNumeroGa4,
  URL_REPORTE_GA4,
  URL_TOKEN_GA4,
  vistaTraficoGa4,
} from '@/lib/ga4'

const PAR = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const JSON_CUENTA = JSON.stringify({
  type: 'service_account',
  client_email: 'ternio-ga4@ejemplo.iam.gserviceaccount.com',
  private_key: PAR.privateKey,
})

const ENV_OK = {
  GA4_PROPERTY_ID: '123456789',
  GA4_SERVICE_ACCOUNT_JSON: JSON_CUENTA,
}

function jsonResponse(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fetchOk(args?: {
  d7?: { sesiones: string; usuarios: string }
  d28?: { sesiones: string; usuarios: string }
  landings7?: Array<{ path: string; sesiones: string }>
  landings28?: Array<{ path: string; sesiones: string }>
}): typeof fetch {
  const d7 = args?.d7 ?? { sesiones: '120', usuarios: '80' }
  const d28 = args?.d28 ?? { sesiones: '500', usuarios: '300' }
  const landings7 = args?.landings7 ?? [{ path: '/seguridad', sesiones: '40' }]
  const landings28 = args?.landings28 ?? [
    { path: '/seguridad', sesiones: '200' },
    { path: '/', sesiones: '90' },
  ]

  return async (url, init) => {
    const destino = String(url)
    if (destino === URL_TOKEN_GA4) {
      return jsonResponse({ access_token: 'token-de-prueba' })
    }
    if (!destino.startsWith(`${URL_REPORTE_GA4}/properties/123456789:runReport`)) {
      throw new Error(`url inesperada: ${destino}`)
    }
    const cuerpo = JSON.parse(String(init?.body)) as {
      dimensions?: Array<{ name: string }>
      dateRanges?: Array<{ name?: string; startDate: string }>
    }
    if (cuerpo.dimensions?.some((d) => d.name === 'landingPage')) {
      const es7 = cuerpo.dateRanges?.[0]?.startDate !== undefined &&
        cuerpo.dateRanges.length === 1 &&
        cuerpo.dateRanges[0].startDate >= '2026-08-13'
      const filas = (es7 ? landings7 : landings28).map((fila) => ({
        dimensionValues: [{ value: fila.path }],
        metricValues: [{ value: fila.sesiones }],
      }))
      return jsonResponse({
        dimensionHeaders: [{ name: 'landingPage' }],
        metricHeaders: [{ name: 'sessions' }],
        rows: filas,
      })
    }
    return jsonResponse({
      dimensionHeaders: [{ name: 'dateRange' }],
      metricHeaders: [{ name: 'sessions' }, { name: 'activeUsers' }],
      rows: [
        { dimensionValues: [{ value: 'd7' }], metricValues: [{ value: d7.sesiones }, { value: d7.usuarios }] },
        { dimensionValues: [{ value: 'd28' }], metricValues: [{ value: d28.sesiones }, { value: d28.usuarios }] },
      ],
    })
  }
}

describe('parsearPropertyId', () => {
  it('acepta solo el número de la property', () => {
    expect(parsearPropertyId('123456789')).toEqual({ ok: true, id: '123456789' })
  })

  it('rechaza GTM, G- y el prefijo properties/', () => {
    expect(parsearPropertyId('GTM-K3F8GGHV').ok).toBe(false)
    expect(parsearPropertyId('GTM-PCR596Z2').ok).toBe(false)
    expect(parsearPropertyId('G-ABCDEFG12').ok).toBe(false)
    expect(parsearPropertyId('properties/123456789').ok).toBe(false)
    expect(parsearPropertyId('UA-123-1').ok).toBe(false)
  })
})

describe('parsearServiceAccountJson', () => {
  it('acepta un JSON de service account', () => {
    const parsed = parsearServiceAccountJson(JSON_CUENTA)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.cuenta.clientEmail).toBe('ternio-ga4@ejemplo.iam.gserviceaccount.com')
    }
  })

  it('rechaza JSON roto, tipo incorrecto o sin llave', () => {
    expect(parsearServiceAccountJson('{').ok).toBe(false)
    expect(parsearServiceAccountJson('{"type":"user"}').ok).toBe(false)
    expect(
      parsearServiceAccountJson(
        JSON.stringify({ type: 'service_account', client_email: 'a@b.c', private_key: 'nope' }),
      ).ok,
    ).toBe(false)
  })
})

describe('fechas America/Santiago', () => {
  it('usa la fecha civil de Santiago, no la UTC', () => {
    expect(fechaCivilSantiago(new Date('2026-08-19T02:00:00Z'))).toBe('2026-08-18')
    expect(fechaCivilSantiago(new Date('2026-08-19T18:00:00Z'))).toBe('2026-08-19')
  })

  it('corta 7 y 28 días inclusive hoy', () => {
    const ahora = new Date('2026-08-19T18:00:00Z')
    expect(rangoFechasGa4(7, ahora)).toEqual({ desde: '2026-08-13', hasta: '2026-08-19' })
    expect(rangoFechasGa4(28, ahora)).toEqual({ desde: '2026-07-23', hasta: '2026-08-19' })
  })
})

describe('mapeo de reportes', () => {
  it('lee sesiones y usuarios por rango', () => {
    const mapped = mapearReporteTotales({
      dimensionHeaders: [{ name: 'dateRange' }],
      metricHeaders: [{ name: 'sessions' }, { name: 'activeUsers' }],
      rows: [
        { dimensionValues: [{ value: 'd7' }], metricValues: [{ value: '10' }, { value: '7' }] },
        { dimensionValues: [{ value: 'd28' }], metricValues: [{ value: '40' }, { value: '22' }] },
      ],
    })
    expect(mapped).toEqual({
      d7: { sesiones: 10, usuarios: 7 },
      d28: { sesiones: 40, usuarios: 22 },
    })
  })

  it('sin filas es cero medido, no un error', () => {
    expect(
      mapearReporteTotales({
        dimensionHeaders: [{ name: 'dateRange' }],
        metricHeaders: [{ name: 'sessions' }, { name: 'activeUsers' }],
      }),
    ).toEqual({
      d7: { sesiones: 0, usuarios: 0 },
      d28: { sesiones: 0, usuarios: 0 },
    })
  })

  it('un error de API no se mapea a ceros', () => {
    expect(mapearReporteTotales({ error: { code: 403, message: 'denied' } })).toBeNull()
  })

  it('lee landing paths', () => {
    expect(
      mapearReporteLandings({
        dimensionHeaders: [{ name: 'landingPage' }],
        metricHeaders: [{ name: 'sessions' }],
        rows: [
          { dimensionValues: [{ value: '/aseo/santiago' }], metricValues: [{ value: '9' }] },
          { dimensionValues: [{ value: '(not set)' }], metricValues: [{ value: '1' }] },
        ],
      }),
    ).toEqual([
      { path: '/aseo/santiago', sesiones: 9 },
      { path: '(sin path)', sesiones: 1 },
    ])
  })
})

describe('firmarJwtServicio', () => {
  it('firma RS256 con scope de solo lectura', () => {
    const parsed = parsearServiceAccountJson(JSON_CUENTA)
    if (!parsed.ok) throw new Error('cuenta de test inválida')
    const jwt = firmarJwtServicio(parsed.cuenta, 1_700_000_000)
    const [, payload] = jwt.split('.')
    const claims = JSON.parse(Buffer.from(payload ?? '', 'base64url').toString()) as {
      iss: string
      scope: string
      aud: string
    }
    expect(claims.iss).toBe('ternio-ga4@ejemplo.iam.gserviceaccount.com')
    expect(claims.scope).toBe(SCOPE_GA4)
    expect(claims.aud).toBe(URL_TOKEN_GA4)
    expect(jwt.split('.')).toHaveLength(3)
  })
})

describe('cargarTraficoGa4 fail-closed', () => {
  it('sin env queda desconectado y no inventa un número', async () => {
    const fetchFn = async () => {
      throw new Error('no debería llamar a la red')
    }
    const trafico = await cargarTraficoGa4({
      env: { NEXT_PUBLIC_GTM_ID: 'GTM-K3F8GGHV' },
      fetchFn,
    })
    expect(trafico).toEqual(desconectadoGa4(MOTIVO_GA4.envFaltante))
    expect(trafico).not.toHaveProperty('sesiones')
    expect(trafico).not.toHaveProperty('usuarios')
    expect(trafico).not.toHaveProperty('cortes')
    const vista = vistaTraficoGa4(trafico)
    expect(vista.conectado).toBe(false)
    expect(vista.cortes).toEqual([])
    expect(vista.mensaje.toLowerCase()).not.toMatch(/\d[\d.]+\s*(visitas|sesiones|usuarios)/)
    expect(vista.mensaje).toMatch(/no está conectado/)
  })

  it('no acepta un GTM como property id', async () => {
    const trafico = await cargarTraficoGa4({
      env: {
        GA4_PROPERTY_ID: 'GTM-K3F8GGHV',
        GA4_SERVICE_ACCOUNT_JSON: JSON_CUENTA,
      },
      fetchFn: async () => {
        throw new Error('no debería llamar a la red')
      },
    })
    expect(trafico).toEqual(desconectadoGa4(MOTIVO_GA4.propertyInvalida))
  })

  it('JSON inválido no finge cero visitas', async () => {
    const trafico = await cargarTraficoGa4({
      env: {
        GA4_PROPERTY_ID: '123456789',
        GA4_SERVICE_ACCOUNT_JSON: '{no-json',
      },
    })
    expect(trafico).toEqual(desconectadoGa4(MOTIVO_GA4.jsonInvalido))
  })

  it('si la API falla, desconectado — no un 0 medido', async () => {
    const trafico = await cargarTraficoGa4({
      env: ENV_OK,
      fetchFn: async () => jsonResponse({ error: { message: 'boom' } }, 403),
    })
    expect(trafico).toEqual(desconectadoGa4(MOTIVO_GA4.api))
  })
})

describe('cargarTraficoGa4 conectado', () => {
  it('con mock válido renderiza los números de GA4', async () => {
    const trafico = await cargarTraficoGa4({
      env: ENV_OK,
      fetchFn: fetchOk(),
      ahora: new Date('2026-08-19T18:00:00Z'),
    })
    expect(trafico.estado).toBe('conectado')
    if (trafico.estado !== 'conectado') return
    expect(trafico.fuente).toBe('GA4')
    expect(trafico.zona).toBe('America/Santiago')
    expect(trafico.cortes[0]).toMatchObject({
      dias: 7,
      desde: '2026-08-13',
      hasta: '2026-08-19',
      sesiones: 120,
      usuarios: 80,
    })
    expect(trafico.cortes[0]?.landings).toEqual([{ path: '/seguridad', sesiones: 40 }])
    expect(trafico.cortes[1]).toMatchObject({ dias: 28, sesiones: 500, usuarios: 300 })

    const vista = vistaTraficoGa4(trafico)
    expect(vista.conectado).toBe(true)
    expect(vista.cortes[0]?.sesiones).toBe(textoNumeroGa4(120))
    expect(vista.cortes[0]?.usuarios).toBe(textoNumeroGa4(80))
    expect(vista.mensaje).toMatch(/pageviews propias/)
    expect(vista.mensaje).not.toMatch(/embudo.*GA4.*mismo/)
  })

  it('ceros solo si la API conectada no trajo filas', async () => {
    const trafico = await cargarTraficoGa4({
      env: ENV_OK,
      ahora: new Date('2026-08-19T18:00:00Z'),
      fetchFn: async (url, init) => {
        const destino = String(url)
        if (destino === URL_TOKEN_GA4) return jsonResponse({ access_token: 't' })
        const cuerpo = JSON.parse(String(init?.body)) as { dimensions?: unknown }
        if (cuerpo.dimensions) {
          return jsonResponse({
            dimensionHeaders: [{ name: 'landingPage' }],
            metricHeaders: [{ name: 'sessions' }],
          })
        }
        return jsonResponse({
          dimensionHeaders: [{ name: 'dateRange' }],
          metricHeaders: [{ name: 'sessions' }, { name: 'activeUsers' }],
        })
      },
    })
    expect(trafico.estado).toBe('conectado')
    if (trafico.estado !== 'conectado') return
    expect(trafico.cortes[0]?.sesiones).toBe(0)
    expect(trafico.cortes[0]?.usuarios).toBe(0)
  })
})

describe('instalación admin', () => {
  const embudo = readFileSync(resolve(process.cwd(), 'src/app/admin/embudo/page.tsx'), 'utf8')
  const bloque = readFileSync(resolve(process.cwd(), 'src/components/admin/trafico-ga4.tsx'), 'utf8')
  const gtm = readFileSync(resolve(process.cwd(), 'src/lib/gtm.ts'), 'utf8')
  const envEjemplo = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')

  it('el embudo first-party sigue y GA4 es un bloque aparte', () => {
    expect(embudo).toMatch(/cargarTableroEmbudo/)
    expect(embudo).toMatch(/BloqueTraficoGa4/)
    expect(embudo).toMatch(/cargarTraficoGa4Admin/)
    expect(embudo).toMatch(/pageviews propias/)
    expect(embudo).toMatch(/requerirAdmin/)
    expect(bloque).toMatch(/Tráfico GA4/)
    expect(bloque).toMatch(/vistaTraficoGa4/)
    expect(bloque).not.toMatch(/GA4_SERVICE_ACCOUNT_JSON|private_key/)
  })

  it('no toca el contenedor público ni acepta IDs de Haberes', () => {
    expect(gtm).toMatch(/GTM-K3F8GGHV/)
    expect(gtm).not.toMatch(/GTM-PCR596Z2/)
    expect(embudo).not.toMatch(/GTM-PCR596Z2|Haberes/)
  })

  it('.env.example deja las keys vacías, sin credenciales de muestra', () => {
    expect(envEjemplo).toMatch(/GA4_PROPERTY_ID=""/)
    expect(envEjemplo).toMatch(/GA4_SERVICE_ACCOUNT_JSON=""/)
    expect(envEjemplo).not.toMatch(/BEGIN PRIVATE KEY|client_email|123456789/)
    expect(envEjemplo).toMatch(/Nunca un GTM/)
  })
})
