# Ternio

Marketplace de leads B2B en Chile. El comprador cotiza gratis; el proveedor
compra el contacto verificado. El comprador nunca paga.

**La fuente de verdad de producto e ingeniería es
[`docs/guia-de-desarrollo.md`](./docs/guia-de-desarrollo.md).** Ahí está qué
es / qué no es, referentes, la definición de “100% operativa” y cómo se
trabaja. Si `CLAUDE.md` choca con la guía, gana la guía.

También: [`docs/como-funciona.md`](./docs/como-funciona.md) (flujos),
[`docs/seo-map.md`](./docs/seo-map.md) (keyword → URL),
[`docs/lanzamiento.md`](./docs/lanzamiento.md) (checklist).

`CLAUDE.md` es el prompt maestro histórico (fases, stack, reglas duras).

La app cubre el contrato operativo de la guía: cotizar, tomar contactos
en `/panel` y operar desde `/admin`. Flow recarga packs si hay
`FLOW_API_KEY` / `FLOW_SECRET_KEY`; el pack de arranque no depende de eso.

## Stack

Next.js 15 (App Router) · TypeScript estricto · Prisma + PostgreSQL (Neon) ·
Tailwind v4 · Auth.js v5 (OTP de teléfono para compradores, Credentials para el admin).

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local     # completa los valores; nunca los subas al repo
pnpm prisma migrate deploy     # o `pnpm db:migrate` en desarrollo
pnpm hash:password 'tu-contraseña'   # el hash va en ADMIN_PASSWORD_HASH
pnpm db:seed                   # 8 rubros, 346 comunas CUT y cuenta de admin
pnpm dev
```

Las variables de entorno están documentadas una por una en
[`.env.example`](./.env.example). En Vercel (y en `.env.local`) son
**obligatorias por nombre**:

- `DATABASE_URL` — conexión de Neon para la app. En producción usa la pooled
  (host con `-pooler`).
- `DIRECT_URL` — conexión directa de Neon (**sin** `-pooler`), la misma que
  Neon llama `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING`. Prisma la
  usa para `migrate deploy`. Si falta, el build copia una de esas.
- `AUTH_SECRET` — secreto de Auth.js. Genera uno con `openssl rand -base64 32`.
- `ADMIN_EMAIL` — correo de la cuenta admin.
- `ADMIN_PASSWORD_HASH` — hash bcrypt; se genera con
  `pnpm hash:password 'tu-contraseña'`.

El seed (`pnpm db:seed`) es **seguro de re-ejecutar**: crea rubros si faltan
(no pisa copy ni precios del admin), hace upsert de las 346 comunas del CUT y
solo publica páginas SEO para las 8 comunas piloto. Sigue siendo un comando
aparte: no corre en el build de Vercel (tsx vive en devDependencies). Si la
home sale vacía en producción, corre el seed contra Neon.

El build de producción aplica las migraciones (`prisma generate`,
`prisma migrate deploy` con reintentos, `next build`). El comando vive solo
en `package.json` (`pnpm run build`); `vercel.json` lo invoca, no lo duplica.

Dos que conviene entender antes de desplegar:

- El panel de admin vive en **`/admin`**. No aparece en el sitio, ni en el
  sitemap, ni en `robots.txt` (listarla ahí la revelaría). Esa URL es
  cosmética: la seguridad real es el rol `ADMIN` validado en servidor, y
  cualquier otro caso responde 404.
- **`TURNSTILE_SECRET_KEY`** es *fail-closed*: si falta en producción, la
  creación de leads falla con un mensaje explícito. Nunca se guarda un lead sin
  pasar la verificación antifraude.

## Validaciones

```bash
pnpm lint        # ESLint (next/core-web-vitals + next/typescript)
pnpm typecheck   # tsc --noEmit, modo estricto
pnpm test        # Vitest
pnpm build       # build de producción
pnpm prisma validate
```

Los tests de integración del reclamo de leads necesitan una base PostgreSQL con
las migraciones aplicadas; sin ella se saltan solos:

```bash
TEST_DATABASE_URL="postgresql://…" pnpm test
```

## Métricas del go/no-go

El criterio de la Fase 0 es **costo por lead verificado < 50% del precio de
venta del lead**. El embudo que lo alimenta se guarda en `EventoAnalitica` y se
ve en el panel de admin, pero también se puede consultar directo:

```sql
-- Embudo de los últimos 30 días: visita → inicio de formulario → lead → cuenta
SELECT tipo, count(*) AS eventos
FROM "EventoAnalitica"
WHERE "createdAt" >= now() - interval '30 days'
GROUP BY tipo
ORDER BY array_position(
  ARRAY['VISITA_PAGINA','FORM_START','LEAD_CREADO','CUENTA_CREADA']::text[],
  tipo::text
);
```

```sql
-- Leads por día y cuántos llegaron a verificarse (denominador del costo por
-- lead verificado). Los de rubros en modo CAPTURA quedan aparte: no se venden.
SELECT date_trunc('day', l."createdAt")::date AS dia,
       count(*)                                        AS leads,
       count(*) FILTER (WHERE l.estado = 'VERIFICADO') AS verificados,
       count(*) FILTER (WHERE l.estado = 'LISTA_ESPERA') AS en_lista_espera
FROM "Lead" l
GROUP BY 1
ORDER BY 1 DESC;
```

`VISITA_PAGINA` y `FORM_START` se registran desde el navegador (las páginas
públicas usan ISR); `LEAD_CREADO` y `CUENTA_CREADA` se registran en el servidor
cuando de verdad ocurren, para que el criterio no sea falsificable desde el
cliente. `CUENTA_CREADA` se cuenta una vez por cuenta, no por cotización.

## Cómo está organizado

| Ruta | Qué hace |
| --- | --- |
| `src/app/(seo)/[rubro]/[comuna]` | Página programática con ISR y el formulario de cotización |
| `src/app/cotizacion/enviada` | Pantalla post-envío: código SMS y sesión |
| `src/app/entrar` | Reingreso por OTP de teléfono (comprador o proveedor) |
| `src/app/mis-cotizaciones` | Panel del comprador: estado honesto + próximo paso |
| `src/app/proveedores` | Alta de cuenta de proveedor (RUT + cobertura + OTP) |
| `src/app/panel` | Cuenta mínima del proveedor; sin marketplace |
| `src/app/admin/*` | Panel del dueño en `/admin`; 404 si no hay rol ADMIN |
| `src/server/*` | Server actions y helpers de sesión |
| `src/lib/*` | Lógica pura y reutilizable (RUT, teléfono, score, rubros, tokens) |
| `prisma/` | Schema, migraciones y seed idempotente |

Los rubros, sus campos de formulario, sus precios y sus comunas son **filas en
la base de datos**: agregar un rubro no toca código.
