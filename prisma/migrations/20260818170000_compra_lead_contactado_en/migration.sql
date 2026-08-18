-- Aditivo: marca de «ya contacté» en CompraLead (tasa de contacto del panel).
-- Nullable; compras previas parten no contactadas. Sin backfill ni DROP.

ALTER TABLE "CompraLead" ADD COLUMN "contactadoEn" TIMESTAMP(3);
