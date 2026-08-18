# Mapa SEO — keyword → URL

Volúmenes: Semrush Chile, referencia de demanda (no son posiciones
nuestras). Ternio **no está indexado solo porque el sitemap exista**: hay
que enviar el sitemap en Search Console y pedir indexación. Este archivo
deja las URLs listas y honestas.

Sitio canónico: `https://ternio.cl`.

---

## Cómo se indexa

1. `https://ternio.cl/sitemap.xml` debe responder **200**. Si la base
   falla, el sitemap degrada a URLs fijas (home + 3 rubros VENTA +
   legales + `/proveedores`). Nunca 500.
2. `https://ternio.cl/robots.txt` apunta al sitemap. **No** menciona
   `/admin` (listarla la revelaría). Sí bloquea `/panel`, `/entrar`,
   `/mis-cotizaciones`, `/cotizacion/`, `/api/`.
3. En Search Console (propiedad `ternio.cl` ya existe): enviar sitemap y
   pedir indexación de `/`, `/seguridad`, `/aseo`, `/plagas`.
4. Canonical en cada página. Alias 308 hacia la canónica. Sin contenido
   duplicado.

Código: `src/app/sitemap.ts`, `src/lib/sitemap-publico.ts`,
`src/lib/seo-rutas.ts`, `next.config.ts`, `src/app/robots.ts`.

---

## Por qué el piloto de comunas es acotado

El seed carga las **346 comunas del CUT** (el selector de todo Chile
funciona). Las páginas `{rubro}/{comuna}` **indexables** se crean solo
para 8 comunas piloto × 8 rubros (`COMUNAS_SEO` en
`prisma/catalogo-inicial.ts`):

`santiago`, `las-condes`, `providencia`, `vitacura`, `nunoa`, `maipu`,
`quilicura`, `pudahuel`.

Motivo: no publicar 346 × 8 ≈ 2.768 URLs con plantilla vacía. Google
castiga thin content. El resto de Chile cotiza igual: home o página de
rubro → Región → Provincia → Comuna → formulario (si no hay página
publicada, la URL es `/{rubro}?comuna=`).

Cuando una comuna tenga copy propio (`RubroComuna.contenido` o
`Rubro.contenidoSeo` + texto de comuna), se activa la fila y entra al
sitemap. Eso no es un cambio de código.

---

## Head terms (rubros en VENTA)

| Keyword | Vol/mes (ref.) | URL canónica | Alias 308 | Estado |
| --- | ---: | --- | --- | --- |
| guardias de seguridad | 3.600 | `/seguridad` | `/guardias-de-seguridad`, `/guardias` | Publicado (página de rubro; indexación hay que pedirla) |
| seguridad privada | 1.900 | `/seguridad` | — | Publicado |
| empresas de seguridad | 590 | `/seguridad` | `/empresas-de-seguridad` | Publicado |
| empresas de aseo / empresa de aseo | 2.400 | `/aseo` | `/empresas-de-aseo` | Publicado |
| control de plagas | 1.300 | `/plagas` | `/control-de-plagas` | **Canónica `/plagas` (200).** El slug de BD sigue siendo `control-de-plagas`. |

H1 y title son únicos por rubro. CTA: Pedir cotización. Schema.org
`Service`. Sin “+1000 empresas”.

Atajos de la home: Seguridad → `/seguridad`, Aseo → `/aseo`, Plagas →
`/plagas`.

---

## Long tail publicado (piloto)

Solo si `RubroComuna.activa`. Title: `{nombre del rubro} en {comuna}`.
Copy distinto por combinación (intro + porqué con comuna y región; no
la misma plantilla calcada). Breadcrumbs. Schema.org `Service` +
`BreadcrumbList`. Formulario precargado.

| Keyword (ejemplo) | Vol/mes (ref.) | URL canónica | Estado |
| --- | ---: | --- | --- |
| empresas de aseo santiago | 390 | `/aseo/santiago` | Piloto / publicado en sitemap si la fila está activa |
| guardias de seguridad santiago | — | `/seguridad/santiago` | Piloto |
| control de plagas providencia | — | `/plagas/providencia` | Piloto (canónica `/plagas/…`; alias `/control-de-plagas/…`) |

Patrón: `/{canonica}/{comuna}` para cada par activo. Alias de plagas:
`/control-de-plagas/{comuna}` → 308 `/plagas/{comuna}`.

Lista piloto de comunas: las 8 de arriba × rubros activos (VENTA y
CAPTURA). CAPTURA publica y captura lista de espera; no vende.

---

## Rubros en CAPTURA (SEO + lista de espera)

Páginas de rubro y combos piloto existen. No se venden leads
(`modoRubroAlCrear = CAPTURA`). Entran al sitemap si el rubro está
activo.

| Rubro | URL canónica | Estado |
| --- | --- | --- |
| Arriendo de baños químicos | `/banos-quimicos` | CAPTURA |
| Arriendo de generadores | `/generadores` | CAPTURA |
| Transporte de personal | `/transporte-de-personal` | CAPTURA |
| Transporte de carga | `/transporte-de-carga` | CAPTURA |
| Climatización industrial | `/climatizacion-industrial` | CAPTURA |

“Control de acceso” no es rubro: es un tipo de cotización dentro de
seguridad.

---

## URLs fijas públicas

| URL | En sitemap | Notas |
| --- | --- | --- |
| `/` | Sí | Home. Frase: “Cotiza servicios para tu empresa”. |
| `/proveedores` | Sí | Alta de cuenta. |
| `/privacidad` | Sí | Ley 21.719. |
| `/terminos` | Sí | — |
| `/entrar` | No | OTP. `robots` disallow. |
| `/mis-cotizaciones` | No | Panel comprador. |
| `/panel` | No | Panel proveedor. |
| `/admin` | **No** (tampoco en robots) | 404 si no es ADMIN. |
| `/cotizacion/enviada` | No | Post-envío. |

---

## Qué no hacemos

- No inventar que Google ya indexó.
- No generar 346 × 8 páginas vacías.
- No duplicar `/plagas` y `/control-de-plagas` con el mismo HTML.
- No poner `/admin` en `robots.txt`.
- No tocar GTM-K3F8GGHV.
