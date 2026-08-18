import { prisma } from '@/lib/prisma'
import { ensureGardSecurity as persistirGard } from '@/lib/gard'

/** Runtime: seed no corre en el build de Vercel. */
export async function ensureGardSecurity() {
  return persistirGard(prisma)
}
