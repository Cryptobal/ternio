import { NextRequest, NextResponse } from 'next/server'

import { statusHttpConfirmacionFlow } from '@/lib/flow'
import { acreditarPackSiPagado } from '@/server/packs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Receta oficial: Flow POST application/x-www-form-urlencoded `token`.
 * Responder 200 en <15s. Con el token: payment/getStatus (firmado).
 * https://developers.flow.cl/docs/tutorial-basics/order-confirmation
 */
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
  const status = statusHttpConfirmacionFlow(Boolean(token))
  if (!token) {
    return NextResponse.json({ error: 'token requerido' }, { status })
  }

  try {
    await acreditarPackSiPagado(token)
  } catch {
    // Flow exige 200. urlReturn reintenta getStatus.
  }
  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function POST(request: NextRequest) {
  return confirmar(request)
}

export async function GET(request: NextRequest) {
  return confirmar(request)
}
