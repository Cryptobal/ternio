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
- [ ] Home: tres números + listas. Suspender si hace falta.
- [ ] Verificar / descartar un lead. Ver PII, saldo y quién lo compró.
- [ ] No hace falta cargar créditos a mano: el alta los acredita sola.

## Proveedor (un caso real)

- [ ] Crear cuenta en `/proveedores` con celular propio y confirmar OTP.
- [ ] Queda `APROBADO` y con 200.000 créditos, sin pasar por admin.
- [ ] Confirmar saldo en `/panel`. Recarga = packs Flow (si
      `FLOW_API_KEY` + `FLOW_SECRET_KEY` están; en Vercel ya están).
- [ ] Ver un lead anónimo que calce. Tomar compartido o exclusivo.
- [ ] Recién ahí ver teléfono / correo / RUT. Ledger con un
      `CONSUMO_LEAD` negativo.
- [ ] Segundo proveedor: exclusivo bloquea; compartido admite hasta 3.

## Flow (recarga; no bloquea el pack de arranque)

En Vercel del proyecto ternio (Gard Security) **ya existen**
`FLOW_API_KEY` y `FLOW_SECRET_KEY` (Production + Preview). No hay
`MERCADOPAGO_*`. No pedir MercadoPago.

Env que lee la app (`process.env`, sin inventar valores):

- `FLOW_API_KEY`
- `FLOW_SECRET_KEY`
- `FLOW_API_URL` (opcional; default `https://www.flow.cl/api`)
- `FLOW_SANDBOX` (opcional; `true`/`1` → `https://sandbox.flow.cl/api`)

Confirmación: `https://ternio.cl/api/flow/confirmacion` (Flow POST
`token` → Ternio `getStatus` → asiento `COMPRA_PACK` si status 2).
Retorno del pagador: `/api/flow/retorno` → `/panel?pago=`.
Sin estas env en local, el pack de arranque igual funciona; la UI de
packs lo dice.

## Lo que NO hay que esperar mañana

- WhatsApp
- Mail automático al verificar
- 346 comunas × rubro con página propia
- Posiciones en Google (hay que pedir indexación y esperar)

## Secretos (nunca en el repo)

`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, admin, Twilio, Turnstile.
Ver `.env.example` (sin valores reales).
