# Ternio — Prompt maestro (marketplace de leads B2B Chile)
## Contexto de negocio
Ternio (ternio.cl) conecta empresas que necesitan un servicio B2B con
proveedores de ese servicio, y monetiza vendiendo el contacto calificado
(lead) a los proveedores. Flujo: el comprador llega por Google a una página
{rubro}/{comuna} → completa el formulario de cotización (micro-pasos) →
confirma el teléfono por OTP (esa es su sesión) → el lead se verifica
(RUT + teléfono) → se ofrece a los proveedores cuya cobertura
calza → compran el contacto con créditos prepagados. El comprador nunca paga.
Rubros iniciales: seguridad privada (punta de lanza; Gard Security, empresa
del dueño, tiene derecho preferente sobre leads que calcen con su perfil),
aseo industrial/oficinas y control de plagas. La plataforma debe soportar
N rubros como configuración, no como código.
El repositorio parte vacío y se construye por fases. Objetivo: negocio de
bajo toque, todo self-serve. La apuesta de captación es SEO fuerte.
## Stack
Next.js 15 App Router, TypeScript estricto, Prisma + Neon PostgreSQL,
Tailwind + shadcn/ui, Auth.js v5 (sesión del comprador por OTP de
teléfono; Credentials para el admin en /admin), Vercel. Pagos: MercadoPago
(packs de créditos). Correo transaccional para avisos (Resend o similar).
Verificación de formulario: Cloudflare Turnstile + OTP por SMS (Twilio).
Canal WhatsApp: Cloud API oficial de Meta, directa — diferido a Fase 5;
nada del lanzamiento depende de él.
## Método de trabajo
1. Propón primero la estructura del repo y el schema Prisma completo, y
   espera mi OK — es la única pausa obligatoria del proyecto.
2. Ejecuta por fases en incrementos pequeños; tras cada uno: build,
   typecheck, lint, tests; reporta qué cambió y qué validaste.
3. Pregunta solo ante decisiones de producto ambiguas o irreversibles; el
   resto resuélvelo con criterio siguiendo las decisiones ya tomadas abajo.
## Decisiones de producto ya tomadas (no volver a preguntar)
- La cotización se captura en un formulario web propio en la página
  {rubro}/{comuna}, con campos dinámicos definidos por la configuración
  del rubro. WhatsApp NO es el canal de captura inicial: queda como canal
  de verificación y seguimiento (con opt-in del formulario) y, más
  adelante, como vía alternativa de cotización (Fase 5).
- Cuenta del comprador: el formulario NUNCA se bloquea por login. El OTP
  del teléfono ES el login: sin contraseñas y sin Google. Tras el envío se
  pide el código SMS; al verificarlo se abre la sesión y el comprador entra
  a /mis-cotizaciones. El lead se captura siempre: si abandona sin OTP
  queda en revisión del admin. Reingreso en /entrar (teléfono → código).
- Cotizador por micro-pasos: una pregunta por pantalla. Primero el módulo
  del rubro (3–6 preguntas configurables en BD; tipos opción única, opción
  múltiple, número, texto corto, sí/no; sin lógica condicional en V1),
  después el tronco común de identidad (razón social → RUT → nombre →
  teléfono → correo). Un solo submit al final. Preguntas mal configuradas
  (0 o >6) degradan al tronco y se reportan en logs sin PII.
- Posicionamiento: "Cotiza servicios para tu empresa". Hogar permitido por
  diseño, apagado al lanzamiento: no aparece en el copy.
- Sin subasta: cero posiciones, rankings, contraofertas o countdowns.
- Social proof real o ninguno. Módulos ilustrativos siempre etiquetados
  "Ejemplo". Canon futuro (requiere marketplace, Fase 3): si nadie toma un
  lead en 24 h → aviso honesto al comprador + alerta admin + fallback Gard
  en seguridad.
- Verificación de leads en capas: (1) RUT obligatorio con dígito
  verificador válido; (2) cruce de razón social contra el SII (directo o
  vía API de terceros; si no es viable en Fase 1, se difiere y se valida
  DV + razón social declarada); (3) teléfono verificado por OTP — por SMS
  primero, por WhatsApp cuando la cuenta de Meta esté verificada; el OTP
  se pide en el panel del comprador tras enviar el formulario, UNA sola vez
  por cuenta: cotizaciones posteriores con ese teléfono no lo repiten;
  (4) señales de score que no excluyen: correo corporativo, dominio
  activo, coherencia de la solicitud. Un correo Gmail no descarta el
  lead, solo reduce su puntaje.
- Regla de venta: solo se venden leads con RUT válido y teléfono
  verificado. El resto queda en cola de revisión del admin o se descarta.
  El proveedor ve etiquetas de verificación en la ficha anónima.
- Antifraude de formulario: Turnstile + honeypot, deduplicación por RUT y
  teléfono, y bloqueo de proveedores generándose leads propios.
- Tres paneles: comprador (/mis-cotizaciones), proveedor (/panel) y admin.
  El admin vive en /admin, sin enlaces en el sitio, fuera del sitemap y SIN
  entrada en robots.txt (listarla la revelaría). La URL es cosmética: la
  seguridad real es el rol ADMIN validado en servidor; el acceso no
  autorizado responde 404.
- Rubros = filas en DB con su configuración: campos del formulario (JSON),
  campos del lead, precios, comunas activas. Agregar un rubro no toca código.
- Rubros al lanzamiento: 3 en modo VENTA (seguridad, aseo, plagas) y 5 en
  modo CAPTURA solo-SEO con lista de espera (arriendo de baños químicos,
  arriendo de generadores, transporte de personal, transporte de carga,
  climatización industrial). Un rubro CAPTURA publica páginas y captura
  leads en lista de espera, pero no vende; pasa a VENTA cuando junta
  demanda y 3–5 proveedores con créditos. "Control de acceso" es un tipo
  de cotización dentro de seguridad, no un rubro aparte.
- El cotizador siempre ofrece "Otro servicio" (texto libre): registra la
  demanda (SolicitudRubro) y deja al comprador en lista de espera. El
  proveedor puede solicitar rubros nuevos en su onboarding. La tabla de
  demanda decide qué rubro se abre después.
- Preferencias de matching por proveedor sobre los campos dinámicos del
  lead (p. ej. tamaño del negocio): columna reservada en el schema desde
  F1; lógica de matching en F3, UI en F4.
- Precios iniciales (editables desde admin): seguridad exclusivo $50.000 /
  compartido $20.000; aseo $25.000 / $10.000; plagas $15.000 / $6.000.
  Compartido = máximo 3 compradores; exclusivo cierra el lead.
- Freshness pricing: 100% del precio las primeras 24 h, −20% hasta 72 h,
  −50% hasta 7 días, luego el lead se archiva.
- Contacto del comprador oculto hasta el pago: los proveedores ven ficha
  anónima (rubro, comuna, tamaño, plazo, etiquetas de verificación); al
  comprar se revela nombre, teléfono, correo y RUT.
- Modo auto-compra opcional por proveedor: "compra todo lead que calce con
  mi cobertura" con tope de gasto mensual.
- Reposición: si el teléfono no contesta o los datos son falsos, el
  proveedor reclama dentro de 48 h; admin revisa y devuelve créditos como
  asiento de reversa en el ledger, nunca como edición.
- Derecho preferente Gard: los leads de seguridad que calcen con el perfil
  de Gard se le ofrecen primero por una ventana corta (configurable,
  default 15 min); si no los toma, siguen el flujo normal. Gard consume
  créditos como cualquier proveedor.
## Fase 0 — Validación (semana 1)
Landing de UN rubro (seguridad) con el formulario real de cotización
(campos desde la config del rubro, validación de DV de RUT, Turnstile) y
medición de eventos: visita → inicio de formulario → lead creado → cuenta
creada. Tras enviar, el comprador confirma el teléfono por OTP y ve su
cotización en un panel mínimo. Los leads llegan al admin (/admin)
para revisión manual. Nada más. El dueño correrá
Google Ads y llamadas a proveedores sobre esta landing. Criterio go/no-go:
costo por lead verificado < 50% del precio de venta del lead.
## Fase 1 — Núcleo de datos y SEO programático
1. Schema Prisma (proponer y validar): Rubro, Comuna, Proveedor, Cobertura,
   Lead, CompraLead, MovimientoCreditos, SolicitudRubro, más lo que
   falte. El Rubro lleva modo VENTA/CAPTURA. El Lead lleva
   estados de verificación con historial de transiciones y un score
   calculable (no un booleano). Ledger de créditos contable: nunca un
   saldo mutable sin historial. Los modelos del canal WhatsApp se agregan
   recién en Fase 5.
2. Páginas programáticas /{rubro}/{comuna} con ISR: contenido único por
   combinación (no plantilla repetida), listado de proveedores de la zona,
   CTA al formulario de cotización, schema.org LocalBusiness, breadcrumbs.
3. Perfiles públicos de proveedor, indexables.
4. Importador CSV para sembrar oferta desde registros públicos (yo aporto
   la lista de empresas de seguridad autorizadas): perfiles "no reclamados"
   con flujo "¿Es tu empresa? Reclámala".
5. sitemap.xml dinámico, Metadata API, mapa keyword→URL en /docs/seo-map.md.
   Referencia de demanda (Semrush Chile): guardias de seguridad 3.600/mes,
   empresas de aseo 2.400, control de plagas 1.300, empresas de seguridad
   590, empresas de aseo santiago 390 — el long tail por comuna multiplica.
## Fase 2 — Verificación y calificación del lead
1. Formulario dinámico por rubro (config en DB), por pasos claros, móvil
   y desktop.
2. Capas de verificación: DV de RUT, cruce SII de razón social, OTP de
   teléfono por SMS en el panel del comprador (una vez por cuenta),
   señales de score, Turnstile + honeypot, dedupe por
   RUT y teléfono.
3. Score del lead y estados: verificado / en revisión / descartado, con
   historial. Cola de revisión en el admin. Solo "verificado" pasa a la
   venta (Fase 3).
4. Registro del opt-in de WhatsApp para el canal futuro.
## Fase 3 — Marketplace de leads
1. Matching lead↔coberturas al quedar verificado el lead; aplicar ventana
   de derecho preferente Gard si corresponde.
2. Aviso inmediato a los proveedores que calcen por correo transaccional,
   con la ficha anónima y link directo de compra. SLA duro: menos de 60
   segundos entre lead verificado y aviso enviado. En Fase 5 se suma el
   aviso por WhatsApp.
3. Compra en un clic desde el link (sesión del proveedor): exclusivo o
   compartido, descuento de créditos, revelación del contacto, registro en
   CompraLead. Cupos y revelación validados en servidor.
4. Tablero de leads activos: filtros por rubro/comuna, precio según edad
   (freshness pricing determinista), compra directa.
5. Packs de créditos con MercadoPago: webhooks idempotentes por
   identificador de pago; nunca marcar pagado sin confirmación de la
   pasarela. Ledger siempre cuadrado.
6. Flujo de reclamo/reposición con revisión en admin y asiento de reversa.
## Fase 4 — Paneles
1. Proveedor: onboarding self-serve (datos, cobertura por rubro y comunas,
   correo para avisos, opt-in de WhatsApp para el canal futuro, compra de
   pack), historial de leads, tasa de contacto, reclamos, modo auto-compra
   con tope.
2. Admin (dueño): aprobar/suspender proveedores, cola de revisión de
   leads, editar rubros/campos/precios/comunas, métricas del negocio
   (leads por día, % verificados, % vendidos, revenue, tiempo
   verificación→aviso, reclamos).
## Fase 5 — Canal WhatsApp (diferida)
Cuando la verificación del negocio en Meta esté completa: Cloud API
oficial directa (prohibido Baileys, whatsapp-web.js o cualquier cliente no
oficial: riesgo de baneo), webhook con verificación de firma, respuesta
200 inmediata y proceso asíncrono (waitUntil o cola tipo QStash/Inngest),
idempotencia por message_id. El OTP por WhatsApp reemplaza al SMS, los
avisos a proveedores suman plantilla utility con opt-in registrado, y se
agrega el bot calificador con IA (Claude modelo económico, fallback
determinístico de preguntas fijas) como vía alternativa de cotización
dentro de la ventana de servicio de 24 h. Nada de la Fase 5 bloquea el
lanzamiento ni la operación de las fases anteriores.
## Reglas duras
- La velocidad es sagrada: cada minuto entre verificación y aviso mata
  conversión. Medir y mostrar ese tiempo en el admin.
- Nunca se vende un lead sin verificación completa; nunca se revela un
  contacto sin pago confirmado. Ambas cosas se validan en servidor:
  ocultar un botón no protege nada.
- Datos personales mínimos y anonimizados hasta el pago; el sitio cumple
  la Ley 21.719 desde el día 1 (aviso de cookies con Rastro, producto del
  dueño; política de privacidad; base legal del tratamiento documentada).
- Todo texto visible en español de Chile, cercano y directo.
- Sin dependencias innecesarias; sin refactors no relacionados; textos de
  las páginas programáticas en archivos/DB editables, no hardcodeados.
- Nunca escribir secretos, tokens ni credenciales en el repositorio,
  README, comentarios o ejemplos.
## Reporte al cierre de cada sesión
Qué se construyó, qué se validó (comandos y resultado), qué queda
pendiente, y riesgos o supuestos que yo deba confirmar.
