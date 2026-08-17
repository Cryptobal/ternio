import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El middleware de Next.js corre en Edge Runtime. Cualquier import de valor
 * desde `@prisma/client` hace fallar el deploy en Vercel (el build local
 * puede pasar igual). Estos archivos son el grafo que entra al bundle Edge.
 */
const ARCHIVOS_EDGE = [
  'src/middleware.ts',
  'src/auth.config.ts',
  'src/lib/admin-ruta.ts',
  'src/lib/roles.ts',
]

describe('bundle Edge sin Prisma', () => {
  for (const archivo of ARCHIVOS_EDGE) {
    it(`${archivo} no importa @prisma/client`, () => {
      const contenido = readFileSync(resolve(process.cwd(), archivo), 'utf8')
      expect(contenido).not.toMatch(/from ['"]@prisma\/client['"]/)
      expect(contenido).not.toMatch(/require\(['"]@prisma\/client['"]\)/)
    })
  }
})
