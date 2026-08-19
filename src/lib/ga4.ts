/**
 * Lectura de la property GA4 de Ternio (Data API).
 *
 * Fail-closed: sin env válido o si la API falla, devolvemos
 * `desconectado` — nunca un 0 que parezca medición. El embudo
 * first-party (pageviews propias) es otra fuente; no se mezclan.
 *
 * GTM-K3F8GGHV es el contenedor público. No es un property id.
 */

import { createSign } from 'node:crypto'

export const ZONA_GA4 = 'America/Santiago'
export const FUENTE_GA4 = 'GA4'
export const URL_TOKEN_GA4 = 'https://oauth2.googleapis.com/token'
export const URL_REPORTE_GA4 = 'https://analyticsdata.googleapis.com/v1beta'
export const SCOPE_GA4 = 'https://www.googleapis.com/auth/analytics.readonly'
export const LANDINGS_TOP = 5
export const CORTES_GA4 = [7, 28] as const

export const MOTIVO_GA4 = {
  envFaltante:
    'El tráfico de GA4 no está conectado. Faltan GA4_PROPERTY_ID o GA4_SERVICE_ACCOUNT_JSON en el entorno.',
  propertyInvalida:
    'El tráfico de GA4 no está conectado. GA4_PROPERTY_ID tiene que ser el número de la property de Ternio, no un ID de GTM ni de medición (G-).',
  jsonInvalido:
    'El tráfico de GA4 no está conectado. GA4_SERVICE_ACCOUNT_JSON no es un JSON válido de service account.',
  api: 'El tráfico de GA4 no está conectado. La API no respondió bien; no inventamos visitas, sesiones ni usuarios.',
} as const

export type MotivoGa4 = (typeof MOTIVO_GA4)[keyof typeof MOTIVO_GA4]

export type CuentaServicioGa4 = {
  clientEmail: string
  privateKey: string
}

export type PaginaGa4 = {
  path: string
  sesiones: number
}

export type CorteGa4 = {
  dias: 7 | 28
  desde: string
  hasta: string
  sesiones: number
  usuarios: number
  landings: PaginaGa4[]
}

export type TraficoGa4Desconectado = {
  estado: 'desconectado'
  fuente: typeof FUENTE_GA4
  motivo: string
}

export type TraficoGa4Conectado = {
  estado: 'conectado'
  fuente: typeof FUENTE_GA4
  zona: typeof ZONA_GA4
  cortes: CorteGa4[]
}

export type TraficoGa4 = TraficoGa4Desconectado | TraficoGa4Conectado

export type VistaCorteGa4 = {
  titulo: string
  rango: string
  sesiones: string
  usuarios: string
  landings: Array<{ path: string; sesiones: string }>
}

export type VistaTraficoGa4 = {
  conectado: boolean
  mensaje: string
  cortes: VistaCorteGa4[]
}

export type EntornoGa4 = {
  GA4_PROPERTY_ID?: string
  GA4_SERVICE_ACCOUNT_JSON?: string
  NEXT_PUBLIC_GTM_ID?: string
}

export type DependenciasGa4 = {
  env?: EntornoGa4
  fetchFn?: typeof fetch
  ahora?: Date
}

const PATRON_PROPERTY = /^\d{1,20}$/
const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIMEOUT_MS = 8_000

export function desconectadoGa4(motivo: string): TraficoGa4Desconectado {
  return { estado: 'desconectado', fuente: FUENTE_GA4, motivo }
}

export function parsearPropertyId(
  crudo: string | undefined,
): { ok: true; id: string } | { ok: false; motivo: typeof MOTIVO_GA4.propertyInvalida } {
  const id = crudo?.trim() ?? ''
  if (!id) return { ok: false, motivo: MOTIVO_GA4.propertyInvalida }
  if (/^(GTM-|G-|UA-|properties\/)/i.test(id)) {
    return { ok: false, motivo: MOTIVO_GA4.propertyInvalida }
  }
  if (!PATRON_PROPERTY.test(id)) {
    return { ok: false, motivo: MOTIVO_GA4.propertyInvalida }
  }
  return { ok: true, id }
}

function esRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function parsearServiceAccountJson(
  crudo: string | undefined,
):
  | { ok: true; cuenta: CuentaServicioGa4 }
  | { ok: false; motivo: typeof MOTIVO_GA4.jsonInvalido } {
  const texto = crudo?.trim() ?? ''
  if (!texto) return { ok: false, motivo: MOTIVO_GA4.jsonInvalido }

  let parsed: unknown
  try {
    parsed = JSON.parse(texto) as unknown
  } catch {
    return { ok: false, motivo: MOTIVO_GA4.jsonInvalido }
  }
  if (!esRecord(parsed)) return { ok: false, motivo: MOTIVO_GA4.jsonInvalido }
  if (parsed.type !== 'service_account') {
    return { ok: false, motivo: MOTIVO_GA4.jsonInvalido }
  }

  const clientEmail = typeof parsed.client_email === 'string' ? parsed.client_email.trim() : ''
  const privateKey = typeof parsed.private_key === 'string' ? parsed.private_key : ''
  if (!PATRON_EMAIL.test(clientEmail)) {
    return { ok: false, motivo: MOTIVO_GA4.jsonInvalido }
  }
  if (!privateKey.includes('PRIVATE KEY')) {
    return { ok: false, motivo: MOTIVO_GA4.jsonInvalido }
  }

  return { ok: true, cuenta: { clientEmail, privateKey } }
}

function partesCiviles(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split('-').map((p) => Number(p))
  return { y: y ?? 0, m: m ?? 0, d: d ?? 0 }
}

function ymdDesdeCivil(y: number, m: number, d: number): string {
  const utc = new Date(Date.UTC(y, m - 1, d))
  const yy = utc.getUTCFullYear()
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(utc.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Fecha civil de `ahora` en America/Santiago (YYYY-MM-DD). */
export function fechaCivilSantiago(ahora: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_GA4,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

/** Últimos `dias` días inclusive hoy, en America/Santiago. */
export function rangoFechasGa4(
  dias: 7 | 28,
  ahora = new Date(),
): { desde: string; hasta: string } {
  const hasta = fechaCivilSantiago(ahora)
  const civil = partesCiviles(hasta)
  const desde = ymdDesdeCivil(civil.y, civil.m, civil.d - (dias - 1))
  return { desde, hasta }
}

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

export function firmarJwtServicio(
  cuenta: CuentaServicioGa4,
  ahoraSeg = Math.floor(Date.now() / 1000),
): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      iss: cuenta.clientEmail,
      scope: SCOPE_GA4,
      aud: URL_TOKEN_GA4,
      iat: ahoraSeg,
      exp: ahoraSeg + 3600,
    }),
  )
  const unsigned = `${header}.${payload}`
  const firmador = createSign('RSA-SHA256')
  firmador.update(unsigned)
  firmador.end()
  return `${unsigned}.${firmador.sign(cuenta.privateKey, 'base64url')}`
}

function enteroNoNegativo(valor: unknown): number | null {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor < 0) return null
    return Math.trunc(valor)
  }
  if (typeof valor !== 'string' || valor.trim() === '') return null
  const n = Number(valor)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.trunc(n)
}

function headersNombrados(json: unknown, clave: 'dimensionHeaders' | 'metricHeaders'): string[] {
  if (!esRecord(json) || !Array.isArray(json[clave])) return []
  return json[clave].map((h) => (esRecord(h) && typeof h.name === 'string' ? h.name : ''))
}

function filasReporte(json: unknown): unknown[] | null {
  if (!esRecord(json)) return null
  if (json.error !== undefined) return null
  if (json.rows === undefined) return []
  if (!Array.isArray(json.rows)) return null
  return json.rows
}

function valorDimension(fila: unknown, indice: number): string | null {
  if (!esRecord(fila) || !Array.isArray(fila.dimensionValues)) return null
  const celda = fila.dimensionValues[indice]
  if (!esRecord(celda) || typeof celda.value !== 'string') return null
  return celda.value
}

function valorMetrica(fila: unknown, indice: number): number | null {
  if (!esRecord(fila) || !Array.isArray(fila.metricValues)) return null
  const celda = fila.metricValues[indice]
  if (!esRecord(celda)) return null
  return enteroNoNegativo(celda.value)
}

function indiceDe(nombres: string[], buscado: string): number {
  return nombres.findIndex((n) => n === buscado)
}

export function mapearReporteTotales(
  json: unknown,
): { d7: { sesiones: number; usuarios: number }; d28: { sesiones: number; usuarios: number } } | null {
  const filas = filasReporte(json)
  if (filas === null) return null

  const dims = headersNombrados(json, 'dimensionHeaders')
  const mets = headersNombrados(json, 'metricHeaders')
  const iRango = indiceDe(dims, 'dateRange')
  const iSesiones = indiceDe(mets, 'sessions')
  const iUsuarios = indiceDe(mets, 'activeUsers')
  if (iRango < 0 || iSesiones < 0 || iUsuarios < 0) return null

  const vacio = { sesiones: 0, usuarios: 0 }
  const out = { d7: { ...vacio }, d28: { ...vacio } }

  for (const fila of filas) {
    const rangoCrudo = valorDimension(fila, iRango)
    const rango =
      rangoCrudo === 'd7' || rangoCrudo === 'date_range_0'
        ? 'd7'
        : rangoCrudo === 'd28' || rangoCrudo === 'date_range_1'
          ? 'd28'
          : null
    if (!rango) return null
    const sesiones = valorMetrica(fila, iSesiones)
    const usuarios = valorMetrica(fila, iUsuarios)
    if (sesiones === null || usuarios === null) return null
    out[rango] = { sesiones, usuarios }
  }

  return out
}

export function mapearReporteLandings(json: unknown): PaginaGa4[] | null {
  const filas = filasReporte(json)
  if (filas === null) return null

  const dims = headersNombrados(json, 'dimensionHeaders')
  const mets = headersNombrados(json, 'metricHeaders')
  const iPath = indiceDe(dims, 'landingPage')
  const iSesiones = indiceDe(mets, 'sessions')
  if (iPath < 0 || iSesiones < 0) return null

  const landings: PaginaGa4[] = []
  for (const fila of filas) {
    const crudo = valorDimension(fila, iPath)
    const sesiones = valorMetrica(fila, iSesiones)
    if (crudo === null || sesiones === null) return null
    const path = crudo.trim() === '' || crudo === '(not set)' ? '(sin path)' : crudo
    landings.push({ path, sesiones })
  }
  return landings.slice(0, LANDINGS_TOP)
}

export function textoNumeroGa4(n: number): string {
  return n.toLocaleString('es-CL')
}

function textoFechaGa4(ymd: string): string {
  const { y, m, d } = partesCiviles(ymd)
  const fecha = new Date(Date.UTC(y, m - 1, d, 12))
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  }).format(fecha)
}

export function vistaTraficoGa4(trafico: TraficoGa4): VistaTraficoGa4 {
  if (trafico.estado === 'desconectado') {
    return { conectado: false, mensaje: trafico.motivo, cortes: [] }
  }

  return {
    conectado: true,
    mensaje: 'Fuente: GA4. No es el mismo conteo que las visitas del embudo (pageviews propias).',
    cortes: trafico.cortes.map((corte) => ({
      titulo: `Últimos ${corte.dias} días`,
      rango: `${textoFechaGa4(corte.desde)} – ${textoFechaGa4(corte.hasta)} · ${ZONA_GA4}`,
      sesiones: textoNumeroGa4(corte.sesiones),
      usuarios: textoNumeroGa4(corte.usuarios),
      landings: corte.landings.map((fila) => ({
        path: fila.path,
        sesiones: textoNumeroGa4(fila.sesiones),
      })),
    })),
  }
}

function avisar(codigo: string) {
  console.warn(`[ga4] ${codigo}`)
}

async function leerJson(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text()
  try {
    return JSON.parse(texto) as unknown
  } catch {
    return null
  }
}

async function tokenServicio(
  cuenta: CuentaServicioGa4,
  fetchFn: typeof fetch,
): Promise<string | null> {
  let jwt: string
  try {
    jwt = firmarJwtServicio(cuenta)
  } catch {
    return null
  }

  const respuesta = await fetchFn(URL_TOKEN_GA4, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!respuesta.ok) return null
  const json = await leerJson(respuesta)
  if (!esRecord(json) || typeof json.access_token !== 'string' || !json.access_token) {
    return null
  }
  return json.access_token
}

async function runReport(
  propertyId: string,
  token: string,
  cuerpo: Record<string, unknown>,
  fetchFn: typeof fetch,
): Promise<unknown | null> {
  const respuesta = await fetchFn(`${URL_REPORTE_GA4}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!respuesta.ok) return null
  return leerJson(respuesta)
}

function cuerpoTotales(d7: { desde: string; hasta: string }, d28: { desde: string; hasta: string }) {
  return {
    dateRanges: [
      { startDate: d7.desde, endDate: d7.hasta, name: 'd7' },
      { startDate: d28.desde, endDate: d28.hasta, name: 'd28' },
    ],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
  }
}

function cuerpoLandings(rango: { desde: string; hasta: string }) {
  return {
    dateRanges: [{ startDate: rango.desde, endDate: rango.hasta }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
    limit: LANDINGS_TOP,
  }
}

/**
 * Lee GA4. No usa GTM, Haberes ni fallbacks. Si algo falla, `desconectado`.
 */
export async function cargarTraficoGa4(deps: DependenciasGa4 = {}): Promise<TraficoGa4> {
  const env = deps.env ?? process.env
  const fetchFn = deps.fetchFn ?? fetch
  const ahora = deps.ahora ?? new Date()

  const propertyCrudo = env.GA4_PROPERTY_ID
  const jsonCrudo = env.GA4_SERVICE_ACCOUNT_JSON

  const property = propertyCrudo?.trim()
    ? parsearPropertyId(propertyCrudo)
    : null
  if (property && !property.ok) {
    avisar('property_invalida')
    return desconectadoGa4(property.motivo)
  }

  const cuenta = jsonCrudo?.trim() ? parsearServiceAccountJson(jsonCrudo) : null
  if (cuenta && !cuenta.ok) {
    avisar('json_invalido')
    return desconectadoGa4(cuenta.motivo)
  }

  if (!property || !cuenta) {
    avisar('env_faltante')
    return desconectadoGa4(MOTIVO_GA4.envFaltante)
  }

  try {
    const token = await tokenServicio(cuenta.cuenta, fetchFn)
    if (!token) {
      avisar('token')
      return desconectadoGa4(MOTIVO_GA4.api)
    }

    const d7 = rangoFechasGa4(7, ahora)
    const d28 = rangoFechasGa4(28, ahora)

    const [totalesJson, landings7Json, landings28Json] = await Promise.all([
      runReport(property.id, token, cuerpoTotales(d7, d28), fetchFn),
      runReport(property.id, token, cuerpoLandings(d7), fetchFn),
      runReport(property.id, token, cuerpoLandings(d28), fetchFn),
    ])

    if (totalesJson === null || landings7Json === null || landings28Json === null) {
      avisar('reporte_http')
      return desconectadoGa4(MOTIVO_GA4.api)
    }

    const totales = mapearReporteTotales(totalesJson)
    const landings7 = mapearReporteLandings(landings7Json)
    const landings28 = mapearReporteLandings(landings28Json)
    if (!totales || !landings7 || !landings28) {
      avisar('reporte_forma')
      return desconectadoGa4(MOTIVO_GA4.api)
    }

    return {
      estado: 'conectado',
      fuente: FUENTE_GA4,
      zona: ZONA_GA4,
      cortes: [
        {
          dias: 7,
          desde: d7.desde,
          hasta: d7.hasta,
          sesiones: totales.d7.sesiones,
          usuarios: totales.d7.usuarios,
          landings: landings7,
        },
        {
          dias: 28,
          desde: d28.desde,
          hasta: d28.hasta,
          sesiones: totales.d28.sesiones,
          usuarios: totales.d28.usuarios,
          landings: landings28,
        },
      ],
    }
  } catch {
    avisar('excepcion')
    return desconectadoGa4(MOTIVO_GA4.api)
  }
}
