# Mapa SEO — keyword → URL

Volúmenes: Semrush Chile (mensual). KD = keyword difficulty. No son
posiciones nuestras. Hay que enviar el sitemap en Search Console y
pedir indexación.

Sitio: `https://ternio.cl` hace 308 a `https://www.ternio.cl`.
El sitemap que Google ve es `https://www.ternio.cl/sitemap.xml`
(ya responde 200 en prod).

---

## Cómo se indexa

1. `https://www.ternio.cl/sitemap.xml` ya es **200** y lista home,
   `/seguridad`, `/aseo`, `/control-de-plagas` y combos piloto.
   El código deja fail-soft: si Prisma falla, igual se publican
   esas URLs fijas (incluidos los 3 rubros VENTA). Nunca 500.
   Sin `/admin` ni `/panel`.
2. `robots.txt` apunta al sitemap. **No** menciona `/admin`.
3. Search Console: enviar el sitemap www y pedir indexación de
   `/`, `/seguridad`, `/aseo`, `/control-de-plagas`.
4. Canonical = slug real. Alias 308. Sin HTML duplicado.

Código: `src/app/sitemap.xml/route.ts` (fail-soft, sin Prisma),
`src/lib/seo-rutas.ts`, `next.config.ts`, `src/app/robots.ts`.

---

## Slug de plagas (dato de prod)

El slug real es **`control-de-plagas`** (seed y sitemap www).
Por eso `https://ternio.cl/plagas` da 404: no es la canónica.

| URL | Rol |
| --- | --- |
| `/control-de-plagas` | Canónica. 200. |
| `/plagas` | Alias 308 → `/control-de-plagas` |
| `/plagas/{comuna}` | Alias 308 → `/control-de-plagas/{comuna}` |

---

## Por qué el piloto de comunas es acotado

Seed: 346 comunas CUT. Páginas `{rubro}/{comuna}` indexables: 8
comunas × 8 rubros (`COMUNAS_SEO`): `santiago`, `las-condes`,
`providencia`, `vitacura`, `nunoa`, `maipu`, `quilicura`,
`pudahuel`. El resto cotiza en `/{rubro}` con el selector.

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
| control de plagas | 1.300 | 21 | `/control-de-plagas` | Control de plagas | `/plagas` |
| control de plagas santiago | 170 | — | `/control-de-plagas/santiago` si existe | Control de plagas en Santiago | `/plagas/santiago` → 308 |
| guardias de seguridad santiago | 20 | — | no priorizar | — | — |

`/seguridad` y `/aseo` ya tienen cotizador Región → Provincia →
Comuna. Se mejora copy/metadata/CTA; no se reinventa el flujo.

---

## Long tail piloto

| Keyword | Vol/mes | URL canónica | Nota |
| --- | ---: | --- | --- |
| empresas de aseo santiago | 390 | `/aseo/santiago` | Prioridad. |
| control de plagas santiago | 170 | `/control-de-plagas/santiago` | Si la combo está activa. |
| guardias de seguridad santiago | 20 | `/seguridad/santiago` | Existe en piloto; **no priorizar**. |

---

## Rubros en CAPTURA

| Rubro | URL canónica | Estado |
| --- | --- | --- |
| Arriendo de baños químicos | `/banos-quimicos` | CAPTURA |
| Arriendo de generadores | `/generadores` | CAPTURA |
| Transporte de personal | `/transporte-de-personal` | CAPTURA |
| Transporte de carga | `/transporte-de-carga` | CAPTURA |
| Climatización industrial | `/climatizacion-industrial` | CAPTURA |

---

## URLs fijas públicas

| URL | En sitemap | Notas |
| --- | --- | --- |
| `/` | Sí | Home. |
| `/seguridad` | Sí | 200 en prod. |
| `/aseo` | Sí | 200 en prod. |
| `/control-de-plagas` | Sí | Canónica de plagas. 200 en prod. |
| `/plagas` | No (alias 308) | No duplicar contenido. |
| `/proveedores` | Sí | Alta. |
| `/privacidad` | Sí | Ley 21.719. |
| `/terminos` | Sí | — |
| `/panel` | No | Proveedor. |
| `/admin` | **No** (tampoco en robots) | 404 si no es ADMIN. |

---

## Qué no hacemos

- No inventar que Google ya indexó.
- No “arreglar” el sitemap www que ya es 200; sí fail-soft si Prisma cae.
- No publicar `/plagas` como canónica (el slug real es `control-de-plagas`).
- No poner `/admin` en `robots.txt`.
- No priorizar “guardias de seguridad santiago” (20/mes).
- No tocar GTM-K3F8GGHV.
