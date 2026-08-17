# AGENTS.md

## Cursor Cloud specific instructions

### Estado actual del repositorio (léelo primero)
Este repositorio es **greenfield**: por ahora solo contiene `CLAUDE.md` (el prompt
maestro del proyecto Ternio) y este `AGENTS.md`. **Todavía no existe código de
aplicación**: no hay `package.json`, ni schema Prisma, ni tests, ni `.cursor/`.
La app se construye por fases (ver `CLAUDE.md`).

Regla dura heredada de `CLAUDE.md`: la **primera** acción del proyecto es proponer
la estructura del repo y el schema Prisma completo y **esperar el OK del dueño**
antes de andamiar. No crees el andamiaje de la app sin ese OK.

### Toolchain disponible en el entorno (ya instalado, no lo reinstales)
- Node.js `v22.x` (compatible con Next.js 15 App Router).
- pnpm `10.x`, npm `10.x`, yarn `1.x` y `corepack` disponibles.
- **No** hay PostgreSQL local ni Docker. El stack usa **Neon PostgreSQL** (serverless):
  Prisma se conecta vía `DATABASE_URL`, no se necesita un Postgres local.

### Update script (refresco de dependencias en cada arranque)
El update script es **idempotente y adaptativo**: si aún no hay `package.json` no
hace nada; cuando exista, instala según el lockfile presente
(`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm ci,
o `npm install` si solo hay `package.json`). No lo dupliques en `start`.

### Cómo correr / validar (una vez que la app esté andamiada)
No dupliques comandos aquí: usa los scripts que se definan en `package.json`
(típicamente `dev`, `build`, `lint`, `test`) y el flujo de Prisma
(`prisma generate`, `prisma migrate dev`). Requisitos no obvios:
- Define `DATABASE_URL` (Neon) como secreto del entorno antes de correr Prisma o
  el servidor de desarrollo; sin él, `prisma migrate`/el runtime fallan.
- El servidor de desarrollo (`next dev`) es un proceso de larga duración: córrelo
  en una terminal tmux, nunca en el update script.
- Secretos (Neon, MercadoPago, Turnstile, proveedor SMS, Resend, etc.) van en la
  sección de Secrets del entorno, nunca en el repo (ver `CLAUDE.md`).
