# Mapa SEO — keyword → URL

Volúmenes: Semrush Chile (mensual). KD = keyword difficulty. No son
posiciones nuestras. Ternio **no está indexado solo porque el sitemap
exista**: hay que enviar el sitemap en Search Console y pedir
indexación.

Sitio canónico: `https://ternio.cl`.

---

## Cómo se indexa

1. `https://ternio.cl/sitemap.xml` debe responder **200**. Lo sirve
   `src/app/sitemap.xml/route.ts` **sin Prisma y sin `catalogo`**.
   `rubrosActivos()` en runtime propaga el error de Prisma (solo lo
   traga en build): por eso el sitemap no lo llama. El XML se arma
   en string (sin `Date` ni `MetadataRoute`) para que un fallo de
   serialización no dé 500. Mínimo fijo: `/`, `/seguridad`, `/aseo`,
   `/plagas`, `/proveedores` (no solo home / legales). Nunca 500.
   Sin `/admin` ni `/panel`.
2. `https://ternio.cl/robots.txt` apunta al sitemap. **No** menciona
   `/admin`. Sí bloquea `/panel`, `/entrar`, `/mis-cotizaciones`,
   `/cotizacion/`, `/api/`.
3. Search Console (propiedad `ternio.cl`): enviar sitemap y pedir
   indexación de `/`, `/seguridad`, `/aseo`, `/plagas`.
4. Canonical en cada página. Alias 308 hacia la canónica. Sin
   contenido duplicado.

Código: `src/app/sitemap.xml/route.ts`, `src/lib/sitemap-publico.ts`,
`src/lib/seo-rutas.ts`, `src/app/(seo)/plagas/page.tsx`,
`next.config.ts`, `src/app/robots.ts`.

---

## Slug de plagas (prod: /plagas era 404)

En seed / BD el rubro se llama `control-de-plagas`
(`prisma/catalogo-inicial.ts`). La URL canónica es **`/plagas`**.
`/control-de-plagas` es alias 308.

`/plagas` es página propia (`src/app/(seo)/plagas/page.tsx`), no
solo un param de `[rubro]`. La carga acepta slug `plagas` **o**
`control-de-plagas` (`slugsBdCandidatos`). No debe quedar 404.

---

## Por qué el piloto de comunas es acotado

El seed carga las **346 comunas del CUT**. Las páginas
`{rubro}/{comuna}` indexables son 8 comunas piloto × 8 rubros
(`COMUNAS_SEO`): `santiago`, `las-condes`, `providencia`,
`vitacura`, `nunoa`, `maipu`, `quilicura`, `pudahuel`.

El resto cotiza igual: `/{rubro}` → Región → Provincia → Comuna
(o `/{rubro}?comuna=`).

---

## Head terms (Semrush Chile)

| Keyword | Vol/mes | KD | URL canónica | Title | Alias 308 |
| --- | ---: | ---: | --- | --- | --- |
| guardias de seguridad | 3.600 | 30 | `/seguridad` | Guardias de seguridad | `/guardias-de-seguridad`, `/guardias` |
| seguridad privada | 1.900 | 34 | `/seguridad` | (misma página; description) | — |
| empresas de seguridad | 590 | 30 | `/seguridad` | (misma página; description) | `/empresas-de-seguridad` |
| empresas de aseo / empresa de aseo | 2.400 | 23 | `/aseo` | Empresas de aseo | `/empresas-de-aseo` |
| empresas de aseo santiago | 390 | 15 | `/aseo/santiago` si `RubroComuna.activa`; si no, `/aseo` | Empresas de aseo en Santiago | — |
| servicio de aseo | 320 | — | `/aseo` | (misma página) | — |
| control de plagas | 1.300 | 21 | `/plagas` | Control de plagas | `/control-de-plagas` |
| control de plagas santiago | 170 | — | `/plagas/santiago` si la combo existe; si no, `/plagas` | Control de plagas en Santiago | `/control-de-plagas/santiago` → 308 |
| guardias de seguridad santiago | 20 | — | no priorizar | — | — |

Piloto (`COMUNAS_SEO`) incluye Santiago: `/aseo/santiago` y
`/plagas/santiago` existen si el seed se corrió. `/seguridad` y
`/aseo` ya tienen cotizador Región → Provincia → Comuna: se
mejora copy/metadata/CTA, no se reinventa el flujo.

H1 único. CTA: Pedir cotización. Schema.org `Service`. Sin
“+1000 empresas”.

Atajos de la home: Guardias de seguridad → `/seguridad`, Empresas
de aseo → `/aseo`, Control de plagas → `/plagas`.

---

## Long tail publicado (piloto)

Solo si `RubroComuna.activa`. Copy distinto por comuna.
Breadcrumbs. Schema.org `Service` + `BreadcrumbList`.

| Keyword | Vol/mes | URL canónica | Nota |
| --- | ---: | --- | --- |
| empresas de aseo santiago | 390 | `/aseo/santiago` | Prioridad. Title: Empresas de aseo en Santiago. |
| control de plagas santiago | 170 | `/plagas/santiago` | Si la combo está activa. |
| guardias de seguridad santiago | 20 | `/seguridad/santiago` | Existe en piloto; **no priorizar**. |

---

## Rubros en CAPTURA (SEO + lista de espera)

| Rubro | URL canónica | Estado |
| --- | --- | --- |
| Arriendo de baños químicos | `/banos-quimicos` | CAPTURA |
| Arriendo de generadores | `/generadores` | CAPTURA |
| Transporte de personal | `/transporte-de-personal` | CAPTURA |
| Transporte de carga | `/transporte-de-carga` | CAPTURA |
| Climatización industrial | `/climatizacion-industrial` | CAPTURA |

“Control de acceso” no es rubro: va dentro de seguridad.

---

## URLs fijas públicas

| URL | En sitemap | Notas |
| --- | --- | --- |
| `/` | Sí | Home. |
| `/seguridad` | Sí | Fija. 200 en prod. |
| `/aseo` | Sí | Fija. 200 en prod. |
| `/plagas` | Sí | Fija. No puede ser 404. |
| `/proveedores` | Sí | Alta de cuenta. |
| `/privacidad` | Sí | Ley 21.719. |
| `/terminos` | Sí | — |
| `/entrar` | No | OTP. |
| `/mis-cotizaciones` | No | Panel comprador. |
| `/panel` | No | Panel proveedor. |
| `/admin` | **No** (tampoco en robots) | 404 si no es ADMIN. |

---

## Qué no hacemos

- No inventar que Google ya indexó.
- No generar 346 × 8 páginas vacías.
- No duplicar `/plagas` y `/control-de-plagas` con el mismo HTML.
- No poner `/admin` en `robots.txt`.
- No priorizar “guardias de seguridad santiago” (20/mes).
- No tocar GTM-K3F8GGHV.
