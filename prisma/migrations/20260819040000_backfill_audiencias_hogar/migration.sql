/**
 * Backfill de audiencias hogar y precios hogar.
 * Corrige el default ['empresa'] que quedó en producción porque el seed
 * no corre en Vercel. Solo UPDATE de configuración de Rubro y Cobertura;
 * no toca leads, compras, ledger, proveedores ni usuarios.
 *
 * Idempotente: precios solo si IS NULL; coberturas solo si siguen en el
 * default ARRAY['empresa'].
 */

-- Hogar exclusivo (3)
UPDATE "Rubro"
SET "audiencias" = ARRAY['hogar']::TEXT[]
WHERE slug IN (
  'aseo-hogar',
  'cuidado-adulto-mayor',
  'tecnico-electrodomesticos'
);

-- Hogar + empresa (11)
UPDATE "Rubro"
SET "audiencias" = ARRAY['hogar', 'empresa']::TEXT[]
WHERE slug IN (
  'gasfiteria',
  'electricista',
  'destape',
  'pintura',
  'remodelaciones',
  'cerrajeria',
  'mudanzas',
  'jardineria',
  'control-de-plagas',
  'seguros',
  'asesoria-financiera'
);

-- Precios hogar (espejo de empresa). Solo donde aún es NULL.
UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 8000, "precioCompartidoHogarClp" = 3000
WHERE slug = 'cerrajeria' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 8000, "precioCompartidoHogarClp" = 3000
WHERE slug = 'tecnico-electrodomesticos' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 8000, "precioCompartidoHogarClp" = 3000
WHERE slug = 'aseo-hogar' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 10000, "precioCompartidoHogarClp" = 4000
WHERE slug = 'destape' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 10000, "precioCompartidoHogarClp" = 4000
WHERE slug = 'jardineria' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 12000, "precioCompartidoHogarClp" = 5000
WHERE slug = 'gasfiteria' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 12000, "precioCompartidoHogarClp" = 5000
WHERE slug = 'electricista' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 15000, "precioCompartidoHogarClp" = 6000
WHERE slug = 'pintura' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 15000, "precioCompartidoHogarClp" = 6000
WHERE slug = 'mudanzas' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 15000, "precioCompartidoHogarClp" = 6000
WHERE slug = 'control-de-plagas' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 15000, "precioCompartidoHogarClp" = 6000
WHERE slug = 'seguros' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 20000, "precioCompartidoHogarClp" = 8000
WHERE slug = 'cuidado-adulto-mayor' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 25000, "precioCompartidoHogarClp" = 10000
WHERE slug = 'remodelaciones' AND "precioExclusivoHogarClp" IS NULL;

UPDATE "Rubro"
SET "precioExclusivoHogarClp" = 25000, "precioCompartidoHogarClp" = 10000
WHERE slug = 'asesoria-financiera' AND "precioExclusivoHogarClp" IS NULL;

-- Coberturas: ampliar solo filas que aún tienen el default y cuyo rubro
-- atiende hogar. No pisa una cobertura que el proveedor ya acotó.
UPDATE "Cobertura" c
SET "audiencias" = r."audiencias"
FROM "Rubro" r
WHERE c."rubroId" = r.id
  AND c."audiencias" = ARRAY['empresa']::TEXT[]
  AND 'hogar' = ANY (r."audiencias");
