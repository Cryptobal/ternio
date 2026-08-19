# Guía de desarrollo — Ternio

Fuente de verdad de producto e ingeniería. Si un agente o una persona
construye sobre este repo, trabaja contra este documento.

Si `CLAUDE.md` choca con esta guía, **gana esta guía**. El delta se anota
al final de `CLAUDE.md`; no se reescribe el prompt maestro.

Textos visibles: español de Chile, cercano y directo.

---

## Qué es Ternio

Marketplace chileno B2B de leads. Una empresa que necesita un servicio
(comprador) cotiza gratis. Un proveedor compra el contacto **después** de
ver una ficha anónima. El comprador nunca paga.

North star: proveedores que recompran.

Go/no-go Fase 0: costo por lead verificado < 50% del precio de venta del lead.

Sitio: [ternio.cl](https://ternio.cl). Repo: este.

---

## Qué NO es

- No es un directorio (Habitissimo gratis).
- No es subasta ni puja (Thumbtack).
- No es comisión al cierre (difícil de cobrar, incentiva ocultar el trato).
- No es hogar. Bark, Hipages y Angi viven de casa. Ternio es empresa-a-empresa:
  RUT, razón social, ticket alto.
- No es “te van a contactar 5 empresas”. Máximo 3 en compartido; exclusivo cierra.

---

## Referentes que sí funcionan (reseña honesta, 2026)

| Producto | País | Modelo | Qué funciona | Qué NO copiamos |
| --- | --- | --- | --- | --- |
| Bark | UK/US/CA | créditos, pay-to-contact, hasta ~5 proveedores | SEO brutal, ficha anónima, precio visible antes de comprar, señales (tel verificado, 1st to respond, urgencia), first-pack guarantee | Créditos que vencen a 3 meses (predatorio). Hasta 5 pirañas al mismo comprador. Hogar. |
| GetNinjas | Brasil | monedas prepago, “liberar pedido” | App simple, nacional, reembolso de lead inválido, sin comisión al cierre | Basura de leads (cualquiera publica). Muchos abren el mismo pedido. |
| Hipages | Australia | membership + lead compartido 3+ | Volumen | Membership + lead compartido mata close rate. No construye activo. |
| Angi / HomeAdvisor | US | lead compartido 3–8, contratos 12 meses | Volumen | FTC 2023 (US$7.2M) por leads engañosos. Contratos. Vender el mismo lead 8 veces. Close rate 8–14%. |
| Habitissimo | ES/Latam | directorio + presupuestos | SEO reformas | Comisión al cierre / Premium listing. Hogar. Opiniones inventables. |
| Thumbtack | US | puja / promote | Matching fino | Complejo, lento, no B2B Chile. |

---

## Cómo Ternio es mejor (decisiones, no slogans)

1. **B2B + RUT + OTP.** No se vende un lead sin RUT con dígito verificador
   válido y teléfono verificado. Eso es la diferencia vs GetNinjas basura.
2. **Exclusivo de verdad, o compartido máx 3.** Angi vende a 8. Acá: exclusivo
   cierra el lead; compartido tope 3 proveedores distintos. El comprador no
   recibe 8 llamadas.
3. **Créditos que no vencen.** Bark vence a 3 meses. Ledger eterno. Si el
   teléfono es falso, reversa en 48 h con asiento `REVERSA` (nunca editar el
   asiento anterior).
4. **Sin contrato de 12 meses, sin membership.** Cargas créditos o el admin
   te los carga. Te vas cuando quieras.
5. **Gard 15 min** en seguridad (comprador ancla). Configurable
   (`GARD_VENTANA_MS`). Después, mercado.
6. **Ficha anónima hasta el pago.** La PII vive solo en `LeadContacto`.
   Las queries de cara al proveedor no la incluyen. El servidor valida; ocultar
   un botón no protege nada.
7. **SEO dueño, no alquiler.** Páginas `/seguridad`, `/aseo`, `/control-de-plagas` y
   `{rubro}/{comuna}`. Quien busca “guardias de seguridad” (~3.600/mes Semrush
   CL) cae en `/seguridad` y cotiza. No dependemos de ads para siempre.
8. **Honestidad.** Sin prueba social falsa. Sin “te van a contactar 5
   empresas”. Si nadie toma en 24 h, se lo decimos (cuando el marketplace
   ya está vivo; no inventar el aviso).
9. **Ley 21.719** desde el día 1 (aviso de cookies con Rastro + privacidad).
10. **Freshness pricing.** 100% las primeras 24 h desde `verificadoAt`;
    −20% hasta 72 h; −50% hasta 7 días; después no se ofrece (el admin puede
    archivar). Lead viejo no se vende caro.

---

## 100% operativa — definición (esto es el contrato)

La app está 100% operativa cuando estos flujos se pueden hacer en
producción (`ternio.cl`), sin mentir.

### A. Comprador encuentra y cotiza

- Google o home → `/seguridad` | `/aseo` | `/control-de-plagas` (o alias 308) → elige
  región / provincia / comuna → cotizador de micro-pasos → Pedir cotización.
- `sitemap.xml` responde HTTP 200. Nunca 500. Se arma sin Prisma (un
  import de catálogo al cargar el módulo era el 500). Mínimo: home,
  `/seguridad`, `/aseo`, `/control-de-plagas`, `/proveedores`. No incluye `/admin`
  ni `/panel`.
- `robots.txt` apunta al sitemap. No lista `/admin` (la revelaría).
- Search Console puede pedir indexación. El código deja las URLs listas;
  **no se afirma que Google ya indexó**.
- Tras el envío: OTP por SMS. RUT con DV. Identidad obligatoria. Turnstile.
- `/mis-cotizaciones` muestra estado real (no un “en proceso” vacío).

### B. Proveedor entra y compra contactos

- `/proveedores` crea cuenta (RUT con DV + OTP de celular). Los links de outreach deben ser `https://www.ternio.cl/proveedores?utm_source=email&utm_medium=outreach&utm_campaign=proveedores`.
- Al verificar el celular, si el RUT es válido, la cuenta queda
  **APROBADA** sola y el sistema acredita 50.000 créditos (`AJUSTE`,
  `idempotencyKey = alta:{proveedorId}`). Carlos no carga créditos.
- `/panel`: si el celular aún no se confirma, un mensaje claro, sin lista
  de leads. Si está aprobado: compradores que calzan cobertura (nacional,
  snapshot de región/provincia/comuna, **o** fila `Cobertura` activa de
  proveedor + rubro + comuna). Ficha anónima. Precio visible. Tomar
  exclusivo o compartido. Recién ahí ve teléfono, correo, RUT y razón
  social.
- Matching respeta `coberturaNacional` y el snapshot. Gard 15 min en
  seguridad. `ensureGardSecurity` corre en seed, `/admin` y `/panel`.
- Saldo visible. Recarga = packs self-serve (50.000 / 200.000 / 500.000)
  por Flow Checkout. Sin botón “pídele a Ternio”.
- Ledger cuadrado: 1 crédito = 1 CLP. Nunca un saldo mutable sin asiento.

### C. Admin opera el negocio

- `/admin` (404 si no es `ADMIN`): de un vistazo, leads por revisar,
  cuentas nuevas, leads a la venta. Suspender. Reversa si el lead era
  falso. Verificar / descartar. Ver saldo y quién compró qué. Ver PII
  del comprador (el admin sí puede). `/admin/rubros` crea y edita
  rubros (desactivar, no borrar). VENTA exige ambos precios > 0 y
  aparece en el cotizador y `/proveedores` sin tocar código.
- El admin **no** es el cajero. Un ajuste de emergencia puede existir
  escondido; no es el flujo normal.
- No hace falta SSH ni Prisma Studio para el día a día.
- Tráfico GA4 en `/admin/embudo` (bloque aparte del embudo first-party;
  no se mezclan). Se lee **la property de Ternio** con la Data API, no
  Haberes ni el contenedor GTM. En Vercel: `GA4_PROPERTY_ID` (solo el
  número, nunca un `GTM-` ni un `G-`) y `GA4_SERVICE_ACCOUNT_JSON`
  (service account con Viewer). Si falta alguno, el JSON es inválido o
  la API falla, el admin dice que no está conectado; cero visitas
  inventadas. GTM-K3F8GGHV sigue siendo el tag público; no se toca.

### D. Documentado en el repo

- Esta guía.
- [`docs/seo-map.md`](./seo-map.md) — keyword → URL.
- [`docs/como-funciona.md`](./como-funciona.md) — flujos A/B/C.
- [`docs/lanzamiento.md`](./lanzamiento.md) — checklist para mañana.

Si A + B + C + D se pueden hacer en `ternio.cl`, está operativa. Lo demás
es crecimiento.

---

## 100% operativa vs “producto soñado”

Soñado (después; **no bloquea** operativa):

- Aviso email < 60 s al verificar un lead
- Auto-compra con tope mensual
- Reposición self-serve (el asiento `REVERSA` ya está en el schema)
- WhatsApp Cloud API (Fase 5; solo API oficial de Meta)
- Perfiles públicos de proveedor indexables
- 346 comunas × rubros con copy único (el piloto SEO es acotado a propósito)
- Cruce SII de razón social
- App nativa
- Blog y FAQ de landings (crecimiento SEO; ya hay un primer corte en
  `/blog` y `seo-contenido.ts`, no bloquea operar)

---

## Stack y repo

| Pieza | Qué usamos |
| --- | --- |
| App | Next.js 15 App Router, TypeScript estricto |
| Datos | Prisma 6.2.1 + Neon PostgreSQL |
| Auth | Auth.js v5: OTP de teléfono (comprador y proveedor), Credentials (admin) |
| Host | Vercel |
| SMS | Twilio (en dev sin keys el código sale en el log) |
| Antifraude | Cloudflare Turnstile + honeypot |
| Analítica | GTM-K3F8GGHV (sitio; no tocarlo). Admin: GA4 Data API (fail-closed) |
| Pagos | Flow Checkout (packs de créditos) |
| WhatsApp | Solo Cloud API oficial, Fase 5 |

Sin dependencias nuevas salvo que sea inevitable. Migraciones solo aditivas.

---

## Arquitectura (archivos reales)

Tres entradas (el comprador no tiene panel):

| Quién | Ruta | Archivo |
| --- | --- | --- |
| Comprador | `/mis-cotizaciones` — tus cotizaciones, no un panel | `src/app/(sitio)/mis-cotizaciones/page.tsx` |
| Proveedor | `/panel` | `src/app/(sitio)/panel/page.tsx` |
| Admin | `/admin` | `src/app/admin/page.tsx` — 404 si no es ADMIN |

Captación:

| Qué | Archivo |
| --- | --- |
| Home | `src/app/(sitio)/page.tsx` |
| Rubro (head term) | `src/app/(seo)/[rubro]/page.tsx` |
| Combo publicado | `src/app/(seo)/[rubro]/[comuna]/page.tsx` |
| Blog (crecimiento) | `src/app/(sitio)/blog/` + `content/blog/*.md` |
| Cotizador | `src/components/formulario-cotizacion.tsx` + `src/server/leads.ts` |
| OTP | `src/server/otp.ts` + `src/lib/otp.ts` |
| Alta proveedor | `src/app/(sitio)/proveedores/page.tsx` + `src/server/proveedores.ts` |
| Sitemap | `src/app/sitemap.xml/route.ts` + `src/lib/sitemap-publico.ts` (sin Prisma) |
| robots | `src/app/robots.ts` |
| Alias SEO | `src/lib/seo-rutas.ts` + `next.config.ts` |

Datos y venta:

| Qué | Dónde |
| --- | --- |
| Schema | `prisma/schema.prisma` |
| Seed | `prisma/seed.ts` + `prisma/catalogo-inicial.ts` |
| PII del comprador | `LeadContacto` (1:1 con `Lead`). Nunca en queries de `/panel` hasta `CompraLead`. |
| Select anónimo | `src/lib/ficha-anonima.ts` (`SELECT_FICHA_ANONIMA`) |
| Venta | `CompraLead` + `MovimientoCreditos` |
| Matching | `src/lib/matching.ts` |
| Precio / ventana Gard / cupos | `src/lib/matching.ts` (funciones puras) |
| Ensure Gard | `src/lib/gard.ts` + `src/server/gard.ts` |
| Tomar lead + ledger | `src/server/marketplace.ts` |
| Packs / Flow | `src/lib/flow.ts` + `src/server/packs.ts` + `/api/flow/confirmacion` |
| Acciones admin | `src/server/admin.ts` |
| Rubros admin | `src/lib/admin-rubros.ts` + `src/server/admin-rubros.ts` + `/admin/rubros` |
| Tráfico GA4 admin | `src/lib/ga4.ts` + `src/server/ga4.ts` + `/admin/embudo` |

Precios de lead de lanzamiento (1 crédito = 1 CLP; editables en admin):

| Rubro | Exclusivo | Compartido |
| --- | ---: | ---: |
| seguridad | 50.000 | 20.000 |
| aseo | 25.000 | 10.000 |
| control-de-plagas | 15.000 | 6.000 |
| baños químicos | 12.000 | 5.000 |
| generadores | 20.000 | 8.000 |
| transporte de personal | 20.000 | 8.000 |
| transporte de carga | 20.000 | 8.000 |
| climatización industrial | 25.000 | 10.000 |
| gasfitería | 12.000 | 5.000 |
| electricista | 12.000 | 5.000 |
| destape | 10.000 | 4.000 |
| pintura | 15.000 | 6.000 |
| remodelaciones | 25.000 | 10.000 |
| cerrajero | 8.000 | 3.000 |
| técnico electrodomésticos | 8.000 | 3.000 |
| mudanzas | 15.000 | 6.000 |
| jardinería | 10.000 | 4.000 |
| aseo a domicilio | 8.000 | 3.000 |
| cuidado adulto mayor | 20.000 | 8.000 |
| contabilidad | 20.000 | 8.000 |
| marketing digital | 25.000 | 10.000 |
| abogados | 25.000 | 10.000 |
| reclutamiento | 20.000 | 8.000 |
| créditos y asesoría financiera | 25.000 | 10.000 |
| seguros | 15.000 | 6.000 |

Catálogo: `Rubro.modo` es `VENTA` o `CAPTURA`. Un lead nacido en `CAPTURA`
(`modoRubroAlCrear`) **nunca** se ofrece a la venta aunque el rubro cambie
después. Las páginas `{rubro}/{comuna}` solo existen si `RubroComuna.activa`.
El piloto SEO es 8 comunas × 25 rubros. Las páginas de rubro cubren todo
Chile con el selector Región → Provincia → Comuna (las 346 del CUT están
sembradas; no hay 346 × N páginas vacías). Los rubros financieros son
lead-gen a asesores/corredores: Ternio no es banco ni vende pólizas.

Fail closed: sin Turnstile en producción no hay lead; sin sesión de
proveedor no hay panel; sin `CompraLead` no hay PII; sin `ADMIN` `/admin`
es 404.

---

## Matching (contrato)

Un lead calza con un proveedor si y solo si:

1. `proveedor.estado === APROBADO`
2. El rubro del lead está en los rubros del proveedor (snapshot
   `solicitudEspera.rubros` **o** filas `Cobertura`)
3. Y la geografía calza: `coberturaNacional` **o** snapshot
   `solicitudEspera` (modo `nacional` / región / provincia / comuna;
   p. ej. Región Metropolitana cubre Providencia) **o** existe
   `Cobertura` activa para ese proveedor + rubro + comuna

Un lead se ofrece solo si:

- `estado === VERIFICADO`
- `modoRubroAlCrear === VENTA`
- `rutValido` y `telefonoVerificado`
- `verificadoAt` dentro de 7 días (después no se ofrece)

### Gard preferente

Si el rubro del lead es `seguridad` **y** existe un proveedor `APROBADO`
que calza y cuyo `slug` es `gard-security` o empieza con `gard`, ese
proveedor ve el lead en exclusiva durante `GARD_VENTANA_MS` (15 min) desde
`verificadoAt`. Los demás ven “disponible en X min” **sin** botón de tomar.
No es un countdown de subasta: es una ventana de derecho preferente. Si no
hay Gard que calce, o ya pasaron 15 min, flujo normal.

### Tomar un lead

Transacción `Serializable`:

1. Recalcular match, ventana Gard, cupos y saldo (suma de
   `MovimientoCreditos.montoCreditos`).
2. Precio vigente (freshness) del tipo elegido. 1 crédito = 1 CLP.
3. Insertar `CompraLead` `PAGADA` + asiento `CONSUMO_LEAD` (negativo) con
   `saldoPosterior`. `contactoReveladoAt` ahora.
4. Exclusivo: solo si no hay ninguna compra `PAGADA`. Cierra el lead.
5. Compartido: hasta 3 proveedores distintos. Si ya hay exclusivo, no.
6. Unique `(leadId, proveedorId)`: no se compra dos veces.

Tras tomar, `/panel` muestra el contacto y “ya es tuyo”. Quien no compró
sigue viendo la ficha anónima (o deja de verlo si no quedan cupos).

---

## Créditos (automáticos + packs)

Carlos no carga créditos. El sistema sí.

- Ledger: solo asientos. Tipos: `COMPRA_PACK`, `CONSUMO_LEAD`, `REVERSA`,
  `AJUSTE`.
- **Alta:** al confirmar el celular por OTP, si el RUT tiene DV válido,
  estado `APROBADO` + `AJUSTE` de 50.000. Key `alta:{proveedorId}`. Si
  el asiento ya existe, no duplicar. Si el RUT no es válido, no se aprueba
  ni se acredita.
- **Recarga:** packs en `/panel` — 50.000 / 200.000 / 500.000 CLP = esos
  créditos. Receta oficial Flow (no inventar):
  [create-order](https://developers.flow.cl/docs/tutorial-basics/create-order)
  y
  [order-confirmation](https://developers.flow.cl/docs/tutorial-basics/order-confirmation).
  `POST application/x-www-form-urlencoded` a
  `https://www.flow.cl/api/payment/create` con `apiKey`, `commerceOrder`,
  `amount`, `email`, `subject`, `urlReturn`, `urlConfirmation`. Firma
  HMAC-SHA256 (keys sort + concat key+value) con `FLOW_SECRET_KEY`;
  campo `s`. Respuesta `{ url, token, flowOrder }`. Redirect
  `url+"?token="+token`. `urlConfirmation`: Flow POST `token`;
  responder **200** en <15s; con el token `GET /payment/getStatus`
  (también firmado); acreditar **solo** si `status === 2` (pagada).
  `idempotencyKey` = `commerceOrder` o `flowOrder`. Asiento
  `COMPRA_PACK`. `urlReturn` → `/panel` con créditos actualizados.
  Nunca acreditar sin `getStatus`.
- Si faltan `FLOW_API_KEY` / `FLOW_SECRET_KEY`, el pack de arranque igual
  funciona. En Vercel del proyecto ternio esas keys ya están (Production
  + Preview). Ver `docs/lanzamiento.md`.
- Admin: puede ver saldo, Suspender y revertir un lead falso (`REVERSA`).
  No es el flujo de recarga. Un ajuste de emergencia escondido está ok.
- Gard Security: `ensureGardSecurity` (seed + `/admin` + `/panel`). Si
  no existe, crea `slug=gard-security`, `APROBADO`,
  `coberturaNacional=true`, snapshot nacional + rubro `seguridad`. Si ya
  hay una fila `gard*`, la usa. Pack de arranque si saldo 0 y no hay
  asiento `alta:{id}`: `AJUSTE` 50.000. Sin teléfono inventado (se
  reclama después). Sin reseñas inventadas.

---

## UX no negociable

- Español de Chile.
- Una columna. Un botón primario por pantalla.
- Región → Provincia → Comuna. Un solo nivel visible a la vez. Sin typeahead.
- “Saltar” solo en pasos opcionales. Continuar bloquea identidad.
- Móvil primero. Targets grandes (`min-h-11`).
- Home: frase canónica (“Cotiza servicios para tu casa o tu empresa”) y
  cotizador en cascada sobre el navy (casa/empresa → servicio → región →
  provincia → comuna). En desktop el hero va a dos columnas (mensaje +
  cotizador); en móvil, apilado. Naranja solo en Cotizar. Bajo el hero:
  cifras honestas desde la DB, catálogo por audiencia con enlaces a
  `/{rubro}` solo si hay combinación publicada, combos `/{rubro}/{comuna}`,
  FAQ + JSON-LD. Sin typeahead ni pastillas de atajo en el cotizador.
  Sin inventar métricas.
- `/panel` de un comprador: “esta es la cuenta de proveedores” + link a
  `/proveedores`. No fingir que es el otro lado.

---

## SEO (números Semrush Chile, referencia)

Detalle en [`docs/seo-map.md`](./seo-map.md).

| Keyword | Vol/mes | KD | Canónica | Alias 308 |
| --- | ---: | ---: | --- | --- |
| guardias de seguridad | 3.600 | 30 | `/seguridad` | `/guardias-de-seguridad`, `/guardias` |
| seguridad privada | 1.900 | 34 | `/seguridad` | — |
| empresas de seguridad | 590 | 30 | `/seguridad` | `/empresas-de-seguridad` |
| empresas de aseo | 2.400 | 23 | `/aseo` | `/empresas-de-aseo` |
| empresas de aseo santiago | 390 | 15 | `/aseo/santiago` si publicada; si no `/aseo` | — |
| servicio de aseo | 320 | — | `/aseo` | — |
| control de plagas | 1.300 | 21 | `/control-de-plagas` | `/plagas` |
| control de plagas santiago | 170 | — | `/control-de-plagas/santiago` si existe | `/plagas/santiago` → 308 |
| guardias de seguridad santiago | 20 | — | no priorizar | — |

El slug real de plagas (seed y prod) es `control-de-plagas`. Canónica
`/control-de-plagas`. `/plagas` redirige 308.

Sitemap www ya es 200. Fail-soft si Prisma falla: `/`, las landings
VENTA (25 slugs, sin aliases) y `/proveedores`. Nunca 500. No incluye
`/admin` ni `/panel`. `/climatizacion` → `/climatizacion-industrial`,
`/gasfiter` → `/gasfiteria`, `/maestro` y `/obras` → `/remodelaciones`,
`/creditos` → `/asesoria-financiera` (308).

No inventar “+1000 empresas” ni prueba social. Schema.org `Service` o
`LocalBusiness` donde corresponda, con datos reales.

GTM-K3F8GGHV ya está. No tocarlo.

---

## Cómo se trabaja en este repo

- Un PR por incremento. `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- No clonar secretos. No inventar prueba social.
- Preguntar solo si es irreversible. El resto lo decide esta guía.
- Schema: migraciones solo aditivas. No reescribir `CLAUDE.md` entero.
- El seed es idempotente y no pisa copy ni precios editados en admin.

---

## Qué falta para crecer (no para operar)

Ver “producto soñado”. Además: matching fino sobre `Cobertura.filtrosJson`,
y el aviso honesto a las 24 h si nadie toma.

Blog público (`/blog`, markdown en `content/blog`): mid-tail how-to y
precios que las landings de rubro no cubren, más FAQ propias en cada
landing. **No** forma parte de “100% operativa”. Un `.md` malo no
tumba el sitemap (fail-soft, HTTP 200). No inventar prueba social
ni volúmenes en los artículos.

Avisos Resend (fail-soft si falta `RESEND_API_KEY`): al pasar un lead a
VERIFICADO se escribe a cada proveedor APROBADO que calza (ficha anónima,
CTA `/panel`); al tomar (`CompraLead` PAGADA) se escribe al comprador
sin nombrar la empresa (CTA `/mis-cotizaciones`). Dedup por
proveedor+lead. Nunca bloquean el lead ni la toma.

El admin también recibe tres avisos (PII sí: el destinatario es Carlos).
Destino: `ADMIN_AVISO_EMAIL` si está definida; si no,
`carlos.irigoyen@gmail.com` (no hace falta una variable nueva en Vercel).
Remitente: el mismo de siempre (`RESEND_FROM` / `Ternio <avisos@ternio.cl>`).
CTA `https://www.ternio.cl/admin` (login en `/admin/ingresar`).

1. Nueva cotización — al crear el lead, con estado (pendiente de OTP o ya
   VERIFICADO). Si nace VERIFICADO, un solo correo. Si después el OTP (u
   otro camino) lo pasa a VERIFICADO, un segundo correo corto “ya
   verificada / a la venta”. Dedup `admin:lead:{leadId}:{estado}`.
2. Alta de proveedor — cuando la cuenta queda APROBADA tras OTP + RUT
   (pack 50.000). No en cada login. No para Gard seed / `ensureGardSecurity`
   (`gard-security`). Dedup `admin:proveedor:{proveedorId}:alta`.
3. Toma de lead — tras `CompraLead` PAGADA: exclusivo o compartido,
   precio en créditos/CLP y nombre del proveedor. Dedup
   `admin:compra:{compraId}`.
