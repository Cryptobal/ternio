#!/usr/bin/env node
/**
 * Prisma en Vercel/Neon. Si DIRECT_URL no está, usa la directa que ya inyecta
 * la integración (DATABASE_URL_UNPOOLED o POSTGRES_URL_NON_POOLING).
 * `migrate deploy` reintenta: un advisory lock concurrente no tumba el deploy.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('uso: node scripts/prisma-con-env.mjs <args de prisma>')
  process.exit(1)
}

const prismaBin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '.bin', 'prisma')
const reintentos = args[0] === 'migrate' && args[1] === 'deploy' ? 3 : 1

for (let intento = 1; intento <= reintentos; intento += 1) {
  const resultado = spawnSync(prismaBin, args, {
    stdio: 'inherit',
    env: process.env,
  })
  const codigo = resultado.status ?? 1
  if (codigo === 0) process.exit(0)
  if (intento < reintentos) {
    console.warn(
      `[prisma] migrate deploy falló (intento ${intento}/${reintentos}); reintento en 5s`,
    )
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000)
  } else {
    process.exit(codigo)
  }
}
