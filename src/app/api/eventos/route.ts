import { NextResponse } from 'next/server'
import { TipoEventoAnalitica } from '@prisma/client'
import { z } from 'zod'

import { registrarEvento } from '@/lib/analitica'
import { prisma } from '@/lib/prisma'
import { consumirRateLimit } from '@/lib/rate-limit'

/**
 * Eventos de embudo enviados desde el navegador.
 *
 * Solo acepta los dos pasos que ocurren antes de tocar el servidor
 * (VISITA_PAGINA y FORM_START). LEAD_CREADO, CUENTA_CREADA y LEAD_AVISADO
 * se registran en el servidor cuando de verdad pasan: si se pudieran mandar
 * desde el cliente, el criterio go/no-go y el SLA serían falsificables.
 */
const cuerpoSchema = z.object({
  tipo: z.enum(['VISITA_PAGINA', 'FORM_START']),
  rubro: z.string().max(80).optional(),
  comuna: z.string().max(80).optional(),
  path: z.string().max(300).optional(),
  sesionAnonId: z.string().uuid().optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'desconocida'

  const limite = consumirRateLimit(`eventos:${ip}`, 60, 60_000)
  if (!limite.permitido) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parseado = cuerpoSchema.safeParse(json)
  if (!parseado.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { tipo, rubro, comuna, path, sesionAnonId } = parseado.data

  const [rubroDb, comunaDb] = await Promise.all([
    rubro ? prisma.rubro.findUnique({ where: { slug: rubro }, select: { id: true } }) : null,
    comuna ? prisma.comuna.findUnique({ where: { slug: comuna }, select: { id: true } }) : null,
  ])

  await registrarEvento({
    tipo: TipoEventoAnalitica[tipo],
    rubroId: rubroDb?.id ?? null,
    comunaId: comunaDb?.id ?? null,
    sesionAnonId: sesionAnonId ?? null,
    path: path ?? null,
  })

  return NextResponse.json({ ok: true })
}
