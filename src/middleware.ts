import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Stub temporal para diagnosticar el fallo de deploy en Vercel. */
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
