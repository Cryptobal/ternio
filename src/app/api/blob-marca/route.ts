import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'

import { blobConfigurado, esLogoBlobPrivado } from '@/lib/logo-proveedor'

export async function GET(request: Request) {
  if (!blobConfigurado()) {
    return NextResponse.json({ error: 'Blob no configurado' }, { status: 503 })
  }

  const url = new URL(request.url).searchParams.get('u')
  if (!url || !esLogoBlobPrivado(url)) {
    return NextResponse.json({ error: 'URL no válida' }, { status: 400 })
  }

  try {
    const blob = await get(url, { access: 'private' })
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return NextResponse.json({ error: 'Logo no encontrado' }, { status: 404 })
    }

    return new Response(blob.stream, {
      headers: {
        'Content-Type': blob.blob.contentType ?? 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('[blob-marca] servir logo', error)
    return NextResponse.json({ error: 'No pudimos cargar el logo' }, { status: 502 })
  }
}
