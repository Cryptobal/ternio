# Cómo funciona Ternio

Flujos A / B / C de la [guía de desarrollo](./guia-de-desarrollo.md).
Si algo de este archivo choca con la guía, gana la guía.

---

## A. Comprador

1. Llega por Google a `/seguridad`, `/aseo` o `/control-de-plagas` (o `/plagas` → 308),
   o entra a la home y elige un atajo / el selector.
2. Elige Región → Provincia → Comuna (sin typeahead). Si esa combinación
   tiene página publicada, va a `/{rubro}/{comuna}` con el formulario
   listo. Si no, cotiza en `/{rubro}?comuna=` — el formulario acepta las
   346 comunas.
3. Cotizador de micro-pasos: primero las 3–6 preguntas del rubro (si
   están bien configuradas; si no, se salta al tronco y se loguea sin
   PII), después razón social → RUT → nombre → teléfono → correo.
   Un submit. Turnstile + honeypot.
4. El lead se guarda siempre. PII solo en `LeadContacto`. RUT con DV:
   `rutValido`. Rubros `CAPTURA` quedan en lista de espera
   (`modoRubroAlCrear` se congela).
5. Se pide OTP por SMS. El código **es** el login. Una vez por teléfono:
   cotizaciones siguientes no lo repiten.
6. Si RUT válido + teléfono verificado + rubro nacido en `VENTA`, el
   lead pasa a `VERIFICADO` (`verificadoAt`). Si abandona sin OTP, queda
   en revisión del admin.
7. `/mis-cotizaciones`: estado real (recibida, en revisión, verificada,
   lista de espera, descartada).

El comprador nunca paga. Nadie le vende su teléfono a un proveedor sin
`CompraLead`.

---

## B. Proveedor

1. `/proveedores`: empresa, RUT, celular, correo, rubros, cobertura
   (nacional / región / provincia / comuna). OTP al celular.
2. Al confirmar el código, si el RUT es válido: estado `APROBADO` +
   200.000 créditos (`AJUSTE`, key `alta:{id}`). Carlos no interviene.
3. `/entrar` con el mismo celular → `/panel`.
4. Si el celular no se confirmó, el RUT no calza, o lo suspendieron: un
   mensaje claro. Sin lista de compradores.
5. Si `APROBADO`:
   - Saldo (suma del ledger). Recarga con packs (Flow Checkout).
   - **Compradores disponibles**: leads `VERIFICADO` que calzan
     (ver matching abajo). Ficha anónima: rubro, comuna, región, edad,
     RUT ok / teléfono ok, precio vigente, cupos. Botones “Exclusivo $X”
     y “Compartido $Y” si hay cupo y saldo. Gard: 15 min solo para Gard
     en seguridad; el resto ve “disponible en X min” sin botón.
   - **Ya tomados**: contacto (nombre, teléfono, correo, RUT, razón
     social) + “ya es tuyo”.
6. Tomar: transacción serializable. Recalcula cupos, Gard, match y
   saldo. Inserta `CompraLead` `PAGADA` + `CONSUMO_LEAD`. Exclusivo
   cierra. Compartido, máximo 3.

Si un comprador abre `/panel`: “esta es la cuenta de proveedores” y
link a `/proveedores` (y a `/mis-cotizaciones`).

---

## C. Admin

Ruta `/admin`. Sin links en el sitio. Fuera del sitemap. **No** está en
`robots.txt`. Si no hay rol `ADMIN`, 404.

1. Home: tres números (leads por revisar, cuentas nuevas, leads a la
   venta) + lista de cuentas nuevas + últimos leads (Verificado /
   Descartar).
2. `/admin/proveedores`: empresa, RUT, celular confirmado, cobertura,
   estado, saldo, Suspender. Reversa de lead falso. Ajuste de emergencia
   escondido (no es recarga).
3. `/admin/compradores` (y `/admin/leads` redirige acá): estado, rubro,
   comuna, RUT ok, tel ok, razón social (PII visible), quién lo compró.
   Verificar / descartar. El detalle `/admin/leads/[id]` sigue existiendo.
4. No hace falta Prisma Studio para operar. El admin no carga el saldo
   de nadie en el día a día.

---

## Matching

Módulo: `src/lib/matching.ts`.

Calza si el proveedor está `APROBADO`, el rubro del lead está en sus
rubros (`solicitudEspera` o `Cobertura`) y la geografía cubre: nacional,
snapshot (RM cubre Providencia) o `Cobertura` activa de ese proveedor +
rubro + comuna.

No se ofrece: `CAPTURA` al nacer, no verificado, RUT inválido, teléfono
sin OTP, más de 7 días desde `verificadoAt`, cupos llenos.

Gard: slug `gard-security` o que empiece con `gard`. Solo rubro
`seguridad`. Ventana 15 min (`GARD_VENTANA_MS`).

---

## Freshness (precio)

Desde `verificadoAt`, sobre el precio del rubro:

| Edad | Factor |
| --- | --- |
| 0–24 h | 100% |
| 24–72 h | −20% |
| 72 h–7 días | −50% |
| > 7 días | no se ofrece |

1 crédito = 1 CLP. Precios iniciales (editables en admin / seed):

| Rubro | Exclusivo | Compartido |
| --- | ---: | ---: |
| seguridad | 50.000 | 20.000 |
| aseo | 25.000 | 10.000 |
| plagas | 15.000 | 6.000 |

---

## Verificación del lead

Capas que sí bloquean la venta: DV de RUT + teléfono OTP (o marca
manual del admin). El admin puede “Marcar verificado” / “Descartar”
sobre `RECIBIDO` / `EN_REVISION`. Verificar exige ambos flags. Un lead
`LISTA_ESPERA` no pasa a venta por ningún camino.

Señales de score (correo corporativo, etc.) no excluyen.

---

## Qué falta (no bloquea operar)

- WhatsApp Cloud API
- Aviso email < 60 s
- Auto-compra
- Reposición self-serve (el tipo `REVERSA` ya está en el schema)
- Cruce SII
- 346 × N páginas con copy único
- Perfiles públicos de proveedor
