-- Activa los 5 rubros de lista de espera a VENTA.
-- Aditivo: no borra filas, no toca créditos, no reactiva "prueba-e2e".
-- Si un precio ya es > 0 (admin), se respeta.

UPDATE "Rubro"
SET
  modo = 'VENTA',
  "precioExclusivoClp" = CASE
    WHEN "precioExclusivoClp" IS NULL OR "precioExclusivoClp" <= 0 THEN 15000
    ELSE "precioExclusivoClp"
  END,
  "precioCompartidoClp" = CASE
    WHEN "precioCompartidoClp" IS NULL OR "precioCompartidoClp" <= 0 THEN 6000
    ELSE "precioCompartidoClp"
  END,
  "contenidoSeo" = CASE
    WHEN "contenidoSeo"::text ILIKE '%te avisamos%'
      OR "contenidoSeo"::text ILIKE '%lista de espera%'
      OR "contenidoSeo"::text ILIKE '%sumando empresas%'
    THEN '{"intro":"Cuéntanos cuántos baños químicos necesitas y para cuándo. Te contactan empresas que arriendan en tu zona.","porQue":"En baños químicos el plazo y la cantidad cambian el precio. Mientras más claro lo dejes, más firme es la cotización."}'::jsonb
    ELSE "contenidoSeo"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'banos-quimicos'
  AND slug <> 'prueba-e2e'
  AND activo = true;

UPDATE "Rubro"
SET
  modo = 'VENTA',
  "precioExclusivoClp" = CASE
    WHEN "precioExclusivoClp" IS NULL OR "precioExclusivoClp" <= 0 THEN 25000
    ELSE "precioExclusivoClp"
  END,
  "precioCompartidoClp" = CASE
    WHEN "precioCompartidoClp" IS NULL OR "precioCompartidoClp" <= 0 THEN 10000
    ELSE "precioCompartidoClp"
  END,
  "contenidoSeo" = CASE
    WHEN "contenidoSeo"::text ILIKE '%te avisamos%'
      OR "contenidoSeo"::text ILIKE '%lista de espera%'
      OR "contenidoSeo"::text ILIKE '%sumando empresas%'
    THEN '{"intro":"Di para qué necesitas el generador y por cuántos días. Te contactan empresas de arriendo que atienden tu comuna.","porQue":"La potencia y los días de arriendo mandan el precio. Un respaldo de oficina no se cotiza igual que una faena."}'::jsonb
    ELSE "contenidoSeo"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'generadores'
  AND slug <> 'prueba-e2e'
  AND activo = true;

UPDATE "Rubro"
SET
  modo = 'VENTA',
  "precioExclusivoClp" = CASE
    WHEN "precioExclusivoClp" IS NULL OR "precioExclusivoClp" <= 0 THEN 20000
    ELSE "precioExclusivoClp"
  END,
  "precioCompartidoClp" = CASE
    WHEN "precioCompartidoClp" IS NULL OR "precioCompartidoClp" <= 0 THEN 8000
    ELSE "precioCompartidoClp"
  END,
  "contenidoSeo" = CASE
    WHEN "contenidoSeo"::text ILIKE '%te avisamos%'
      OR "contenidoSeo"::text ILIKE '%lista de espera%'
      OR "contenidoSeo"::text ILIKE '%sumando empresas%'
    THEN '{"intro":"Cuéntanos cuántas personas y en qué horario. Te contactan empresas de transporte de personal que cubren tu comuna.","porQue":"El recorrido y los turnos cambian el valor. Un acercamiento diario no se cotiza igual que un traslado puntual."}'::jsonb
    ELSE "contenidoSeo"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'transporte-de-personal'
  AND slug <> 'prueba-e2e'
  AND activo = true;

UPDATE "Rubro"
SET
  modo = 'VENTA',
  "precioExclusivoClp" = CASE
    WHEN "precioExclusivoClp" IS NULL OR "precioExclusivoClp" <= 0 THEN 20000
    ELSE "precioExclusivoClp"
  END,
  "precioCompartidoClp" = CASE
    WHEN "precioCompartidoClp" IS NULL OR "precioCompartidoClp" <= 0 THEN 8000
    ELSE "precioCompartidoClp"
  END,
  "contenidoSeo" = CASE
    WHEN "contenidoSeo"::text ILIKE '%te avisamos%'
      OR "contenidoSeo"::text ILIKE '%lista de espera%'
      OR "contenidoSeo"::text ILIKE '%sumando empresas%'
    THEN '{"intro":"Di qué hay que mover y de dónde a dónde. Te contactan empresas de transporte de carga que atienden tu zona.","porQue":"El tipo de carga y la frecuencia mandan. Un flete único no se cotiza igual que una distribución semanal."}'::jsonb
    ELSE "contenidoSeo"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'transporte-de-carga'
  AND slug <> 'prueba-e2e'
  AND activo = true;

UPDATE "Rubro"
SET
  modo = 'VENTA',
  "precioExclusivoClp" = CASE
    WHEN "precioExclusivoClp" IS NULL OR "precioExclusivoClp" <= 0 THEN 25000
    ELSE "precioExclusivoClp"
  END,
  "precioCompartidoClp" = CASE
    WHEN "precioCompartidoClp" IS NULL OR "precioCompartidoClp" <= 0 THEN 10000
    ELSE "precioCompartidoClp"
  END,
  "contenidoSeo" = CASE
    WHEN "contenidoSeo"::text ILIKE '%te avisamos%'
      OR "contenidoSeo"::text ILIKE '%lista de espera%'
      OR "contenidoSeo"::text ILIKE '%sumando empresas%'
    THEN '{"intro":"Cuéntanos si es instalación o mantención y en qué recinto. Te contactan empresas de climatización que cubren tu comuna.","porQue":"El recinto y el tipo de equipo cambian el precio. Una sala de servidores no se cotiza igual que una planta."}'::jsonb
    ELSE "contenidoSeo"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE slug = 'climatizacion-industrial'
  AND slug <> 'prueba-e2e'
  AND activo = true;
