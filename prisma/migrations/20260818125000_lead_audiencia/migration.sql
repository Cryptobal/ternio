-- Aditivo: audiencia del cotizador (hogar | empresa).
-- No toca leads viejos, créditos ni "prueba-e2e".

ALTER TABLE "Lead" ADD COLUMN "audiencia" TEXT;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_audiencia_check"
  CHECK ("audiencia" IS NULL OR "audiencia" IN ('hogar', 'empresa'));
