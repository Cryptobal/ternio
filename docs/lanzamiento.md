# Checklist de lanzamiento — app operativa

Objetivo: que A + B + C de la [guía](./guia-de-desarrollo.md) se puedan
hacer mañana en `ternio.cl` sin mentir. Esto no afirma que Google ya
indexó ni que hay proveedores comprando.

---

## Sitio y datos

- [ ] `https://ternio.cl` responde.
- [ ] Seed corrido contra Neon: 8 rubros, 346 comunas CUT, páginas
      piloto (`COMUNAS_SEO`), cuenta admin. Comando: `pnpm db:seed`
      (no corre solo en el build de Vercel).
- [ ] Gard Security existe (`slug` `gard-security` o fila real Gard),
      `APROBADO`, cobertura nacional, rubro seguridad. Si saldo 0:
      500.000 créditos.
- [ ] `/seguridad`, `/aseo`, `/plagas` responden **200**.
- [ ] `/control-de-plagas` → 308 `/plagas`. `/guardias`,
      `/guardias-de-seguridad`, `/empresas-de-seguridad` → `/seguridad`.
      `/empresas-de-aseo` → `/aseo`.
- [ ] Un combo piloto (ej. `/seguridad/santiago`) abre el cotizador
      precargado.
- [ ] Home: frase “Cotiza servicios para tu empresa” + atajos + selector.

## Sitemap y Google

- [ ] `https://ternio.cl/sitemap.xml` → **200**. Si Neon pestañea, igual
      lista home + 3 rubros. Nunca 500.
- [ ] `https://ternio.cl/robots.txt` apunta al sitemap. **No** menciona
      `/admin`.
- [ ] Search Console: propiedad `ternio.cl` ya existe. Enviar
      `https://ternio.cl/sitemap.xml`.
- [ ] Pedir indexación de `/`, `/seguridad`, `/aseo`, `/plagas`.
      Esperar. No inventar que ya están indexadas.
- [ ] GTM-K3F8GGHV cargado (ya está; no tocarlo). Verificar en GTM
      preview si hace falta.

## OTP y antifraude

- [ ] Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`)
      en Secrets de Vercel. Sin esto, en producción el SMS falla
      explícito.
- [ ] Turnstile: `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`. Fail
      closed: sin secret no se crea lead.
- [ ] Probar envío de cotización + código SMS + `/mis-cotizaciones`.

## Admin (Carlos)

- [ ] `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (`pnpm hash:password`).
- [ ] Entrar a `/admin/ingresar`. Un no-admin ve 404.
- [ ] Home: tres números + listas. Aprobar un proveedor (carga 200.000).
- [ ] Cargar créditos a mano. Suspender si hace falta.
- [ ] Verificar / descartar un lead. Ver PII y quién lo compró.

## Proveedor (un caso real)

- [ ] Crear cuenta en `/proveedores` con celular propio.
- [ ] Aprobarla en admin (o usar Gard si ya tiene usuario).
- [ ] Confirmar saldo en `/panel`.
- [ ] Ver un lead anónimo que calce. Tomar compartido o exclusivo.
- [ ] Recién ahí ver teléfono / correo / RUT. Ledger con un
      `CONSUMO_LEAD` negativo.
- [ ] Segundo proveedor: exclusivo bloquea; compartido admite hasta 3.

## Lo que NO hay que esperar mañana

- Packs MercadoPago
- WhatsApp
- Mail automático al verificar
- 346 comunas × rubro con página propia
- Posiciones en Google (hay que pedir indexación y esperar)

## Secretos (nunca en el repo)

`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, admin, Twilio, Turnstile.
Ver `.env.example` (sin valores reales).
