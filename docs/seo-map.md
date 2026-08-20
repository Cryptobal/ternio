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
   las landings VENTA (25 slugs), combos piloto, `/blog`,
   `/como-funciona`, `/precios` y los artículos. El `<loc>` usa el
   mismo host que los canonicals (`https://www.ternio.cl`). El código
   deja fail-soft: si Prisma o un `.md` del blog fallan, igual se
   publican las URLs fijas (incluidas las landings VENTA y `/blog`).
   Nunca 500. Sin `/admin` ni `/panel`.
2. `robots.txt` apunta al sitemap www. **No** menciona `/admin`.
3. Search Console: enviar el sitemap www y pedir indexación de
   `/` y las landings de rubro.
4. Canonical = slug real. Alias 308. Sin HTML duplicado.

Código: `src/app/sitemap.xml/route.ts` (fail-soft, sin Prisma),
`src/lib/seo-rutas.ts`, `src/lib/blog.ts`, `next.config.ts`,
`src/app/robots.ts`. Host público: `src/lib/metadata-publico.ts`
(`urlPublicaSitio`, siempre www).

---

## Slug de plagas (dato de prod)

El slug real es **`control-de-plagas`** (seed y sitemap www).
Por eso `https://ternio.cl/plagas` da 404: no es la canónica.

| URL | Rol |
| --- | --- |
| `/control-de-plagas` | Canónica. 200. |
| `/plagas` | Alias 308 → `/control-de-plagas` |
| `/plagas/{comuna}` | Alias 308 → `/control-de-plagas/{comuna}` |
| `/climatizacion` | Alias 308 → `/climatizacion-industrial` |
| `/climatizacion/{comuna}` | Alias 308 → `/climatizacion-industrial/{comuna}` |

---

## Por qué el piloto de comunas es acotado

Seed: 346 comunas CUT. Páginas `{rubro}/{comuna}` indexables: 8
comunas × 25 rubros (`COMUNAS_SEO`): `santiago`, `las-condes`,
`providencia`, `vitacura`, `nunoa`, `maipu`, `quilicura`,
`pudahuel`. El resto cotiza en `/{rubro}` con el selector.

---

## Head terms (Semrush Chile)

| Keyword | Vol/mes | KD | URL canónica | Title | Alias 308 |
| --- | ---: | ---: | --- | --- | --- |
| guardias de seguridad | 3.600 | 30 | `/seguridad` | Guardias de seguridad | `/guardias-de-seguridad`, `/guardias`, `/guardia`, `/guarda`, `/guardia-de-seguridad`, `/guarda-de-seguridad` |
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

## Rubros en VENTA (antes CAPTURA)

Los 5 que nacieron en lista de espera cotizan igual que seguridad /
aseo / plagas. `/climatizacion` es alias 308.

| Rubro | URL canónica | Estado |
| --- | --- | --- |
| Arriendo de baños químicos | `/banos-quimicos` | VENTA |
| Arriendo de generadores | `/generadores` | VENTA |
| Transporte de personal | `/transporte-de-personal` | VENTA |
| Transporte de carga | `/transporte-de-carga` | VENTA |
| Climatización industrial | `/climatizacion-industrial` | VENTA |

## Ola hogar / empresa / asesoría (VENTA)

Landings propias. Aliases 308 no van al sitemap. Financiero = asesores,
no bancos.

| Rubro | URL canónica | Alias 308 |
| --- | --- | --- |
| Gasfitería | `/gasfiteria` | `/gasfiter` |
| Electricista | `/electricista` | `/electricistas` |
| Destape y alcantarillado | `/destape` | `/alcantarillado`, `/destape-de-alcantarillado` |
| Pintura | `/pintura` | `/pintor` |
| Remodelaciones | `/remodelaciones` | `/maestro`, `/obras` |
| Cerrajero | `/cerrajeria` | `/cerrajero` |
| Técnico de electrodomésticos | `/tecnico-electrodomesticos` | — |
| Mudanzas y fletes | `/mudanzas` | `/mudanza`, `/fletes` |
| Jardinería | `/jardineria` | `/jardinero` |
| Aseo a domicilio | `/aseo-hogar` | `/nana`, `/nanas`, `/aseo-a-domicilio`, `/aseo-domicilio` |
| Cuidado de adulto mayor | `/cuidado-adulto-mayor` | `/cuidadora` |
| Contabilidad | `/contabilidad` | — |
| Marketing digital | `/marketing-digital` | — |
| Abogados | `/abogados` | — |
| Reclutamiento | `/reclutamiento` | — |
| Créditos y asesoría financiera | `/asesoria-financiera` | `/creditos` |
| Seguros | `/seguros` | — |

---

## URLs fijas públicas

| URL | En sitemap | Notas |
| --- | --- | --- |
| `/` | Sí | Home. |
| `/seguridad` | Sí | 200 en prod. |
| `/aseo` | Sí | 200 en prod. |
| `/control-de-plagas` | Sí | Canónica de plagas. 200 en prod. |
| `/banos-quimicos` | Sí | VENTA. |
| `/generadores` | Sí | VENTA. |
| `/transporte-de-personal` | Sí | VENTA. |
| `/transporte-de-carga` | Sí | VENTA. |
| `/climatizacion-industrial` | Sí | VENTA. |
| `/gasfiteria` | Sí | VENTA. `/gasfiter` es alias. |
| `/aseo-hogar` | Sí | Distinto de `/aseo`. |
| `/asesoria-financiera` | Sí | Asesores, no banco. `/creditos` es alias. |
| `/plagas` | No (alias 308) | No duplicar contenido. |
| `/climatizacion` | No (alias 308) | → `/climatizacion-industrial`. |
| `/proveedores` | Sí | Alta. Precios viven en `/precios`. |
| `/como-funciona` | Sí | Dos lados: cotizas / vendes. |
| `/precios` | Sí | $0 comprador primero; contactos por rubro. |
| `/blog` | Sí | Índice, más nuevo primero. |
| `/blog/cuanto-cuesta-un-guardia-de-seguridad-en-chile` | Sí | → `/seguridad` |
| `/blog/como-elegir-empresa-de-aseo-industrial` | Sí | → `/aseo` |
| `/blog/control-de-plagas-casa-o-empresa-que-pedir` | Sí | → `/control-de-plagas` |
| `/blog/mudanza-en-santiago-que-cotizar` | Sí | → `/mudanzas` |
| `/blog/contador-para-pyme-f29-y-remuneraciones` | Sí | → `/contabilidad` |
| `/blog/gasfiter-de-urgencia-vs-programado` | Sí | → `/gasfiteria` |
| `/blog/destape-de-urgencia-vs-programado` | Sí | → `/destape` |
| `/blog/como-contratar-empresa-de-seguridad-en-chile` | Sí | → `/seguridad` |
| `/privacidad` | Sí | Ley 21.719. |
| `/terminos` | Sí | — |
| `/panel` | No | Proveedor. |
| `/admin` | **No** (tampoco en robots) | 404 si no es ADMIN. |

---

## Blog (mid-tail)

Las landings de rubro cubren el head term. El blog cubre how-to y
precios que esa página no puede (sin inventar volúmenes ni prueba
social). Markdown en `content/blog/*.md`. RSS opcional:
`/blog/rss.xml`.

| Keyword (intención) | URL |
| --- | --- |
| cuánto cuesta un guardia de seguridad | `/blog/cuanto-cuesta-un-guardia-de-seguridad-en-chile` |
| cómo elegir empresa de aseo industrial | `/blog/como-elegir-empresa-de-aseo-industrial` |
| control de plagas casa o empresa | `/blog/control-de-plagas-casa-o-empresa-que-pedir` |
| mudanza en Santiago qué cotizar | `/blog/mudanza-en-santiago-que-cotizar` |
| contador pyme F29 remuneraciones | `/blog/contador-para-pyme-f29-y-remuneraciones` |
| gasfiter urgencia vs programado | `/blog/gasfiter-de-urgencia-vs-programado` |
| destape urgencia vs programado | `/blog/destape-de-urgencia-vs-programado` |
| cómo contratar empresa de seguridad | `/blog/como-contratar-empresa-de-seguridad-en-chile` |

No es parte de “100% operativa”. Crecimiento.

---

## Interlinking desde la home

La home (`/`) y el footer público enlazan solo a rutas ya publicadas:

- Catálogo: `/{rubro}` si el rubro tiene ≥ 1 fila en `combinacionesPublicadas()`.
- Selector de lugar: Región → ciudad → comuna (CUT). Tras elegir comuna,
  solo enlaces `/{rubro}/{comuna}` que ya existen en `combinacionesPublicadas()`.
- Footer: hasta 6 rubros con página + 4 combos destacados («En tu zona»).

No se inventan URLs: todo sale de `combinacionesPublicadas()` + catálogo activo.
FAQ de la home lleva JSON-LD `FAQPage` (mismas 6 preguntas del copy).

---

## Orden del DOM en landings (cotizador)

En `/{rubro}` y `/{rubro}/{comuna}` el formulario (`#cotizar`) va **antes**
del explicador y la FAQ en el DOM móvil, para que el comprador que llega
desde la home aterrice en la pregunta siguiente. El `h1`, la intro, el
copy SEO y el JSON-LD se conservan. En escritorio, `/{rubro}/{comuna}`
sigue en dos columnas (contenido | formulario) con colocación explícita
de grilla. El ancla de la home es `#cotizador`; en landings, `#cotizar`.

---

## Qué no hacemos

- No inventar que Google ya indexó.
- No “arreglar” el sitemap www que ya es 200; sí fail-soft si Prisma cae.
- No publicar `/plagas` como canónica (el slug real es `control-de-plagas`).
- No poner `/admin` en `robots.txt`.
- No priorizar “guardias de seguridad santiago” (20/mes).
- No tocar GTM-K3F8GGHV.
