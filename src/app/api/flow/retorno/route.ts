import { NextRequest, NextResponse } from 'next/server'

import { acreditarPackSiPagado } from '@/server/packs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function destinoPanel(request: NextRequest, pago: 'ok' | 'pendiente' | 'error') {
  const destino = new URL('/panel', request.url)
  destino.searchParams.set('pago', pago)
  return NextResponse.redirect(destino)
}

async function tokenDesde(request: NextRequest): Promise<string | null> {
  const query = request.nextUrl.searchParams.get('token')?.trim()
  if (query) return query
  const form = await request.formData().catch(() => null)
  const campo = form?.get('token')
  return typeof campo === 'string' && campo.trim() ? campo.trim() : null
}

async function volver(request: NextRequest) {
  const token = await tokenDesde(request)
  if (!token) return destinoPanel(request, 'error')

  const result = await acreditarPackSiPagado(token)
  if (result.ok) return destinoPanel(request, 'ok')
  if ('pendiente' in result && result.pendiente) return destinoPanel(request, 'pendiente')
  return destinoPanel(request, 'error')
}

export async function GET(request: NextRequest) {
  return volver(request)
}

export async function POST(request: NextRequest) {
  return volver(request)
}
