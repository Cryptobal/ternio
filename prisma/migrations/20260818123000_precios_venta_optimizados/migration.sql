-- Ajusta defaults de lanzamiento que este mismo PR había dejado en 15/6 y 25/10.
-- Solo pisa esos números (o vacíos). No toca precios custom, ni créditos, ni
-- seguridad / aseo / plagas, ni "prueba-e2e".

UPDATE "Rubro"
SET
  "precioExclusivoClp" = 12000,
  "precioCompartidoClp" = 5000,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'banos-quimicos'
  AND slug <> 'prueba-e2e'
  AND activo = true
  AND (
    "precioExclusivoClp" IS NULL
    OR "precioExclusivoClp" <= 0
    OR "precioCompartidoClp" IS NULL
    OR "precioCompartidoClp" <= 0
    OR ("precioExclusivoClp" = 15000 AND "precioCompartidoClp" = 6000)
  );

UPDATE "Rubro"
SET
  "precioExclusivoClp" = 20000,
  "precioCompartidoClp" = 8000,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'generadores'
  AND slug <> 'prueba-e2e'
  AND activo = true
  AND (
    "precioExclusivoClp" IS NULL
    OR "precioExclusivoClp" <= 0
    OR "precioCompartidoClp" IS NULL
    OR "precioCompartidoClp" <= 0
    OR ("precioExclusivoClp" = 25000 AND "precioCompartidoClp" = 10000)
  );
