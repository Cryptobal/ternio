import { NextRequest, NextResponse } from 'next/server'

import { acreditarPackSiPagado } from '@/server/packs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function tokenDesde(request: NextRequest): Promise<string | null> {
  const query = request.nextUrl.searchParams.get('token')?.trim()
  if (query) return query

  const tipo = request.headers.get('content-type') ?? ''
  if (tipo.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null
    return typeof body?.token === 'string' && body.token.trim() ? body.token.trim() : null
  }

  const form = await request.formData().catch(() => null)
  const campo = form?.get('token')
  return typeof campo === 'string' && campo.trim() ? campo.trim() : null
}

async function confirmar(request: NextRequest) {
  const token = await tokenDesde(request)
  if (!token) {
    return NextResponse.json({ error: 'token requerido' }, { status: 400 })
  }

  const result = await acreditarPackSiPagado(token)
  if (result.ok) {
    return NextResponse.json({ ok: true, duplicado: result.duplicado })
  }
  if ('pendiente' in result && result.pendiente) {
    return NextResponse.json({ ok: true, pendiente: true })
  }
  if ('error' in result && result.reintentar) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ error: 'pago no confirmado' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  return confirmar(request)
}

export async function GET(request: NextRequest) {
  return confirmar(request)
}
