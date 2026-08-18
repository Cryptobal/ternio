-- AlterEnum
ALTER TYPE "EstadoProveedor" ADD VALUE 'RECHAZADO';

-- AlterTable
ALTER TABLE "Comuna" ADD COLUMN "provincia" TEXT NOT NULL DEFAULT '';

-- Backfill: las 8 comunas piloto de la RM viven en la provincia de Santiago.
UPDATE "Comuna"
SET "provincia" = 'Santiago'
WHERE "provincia" = ''
  AND "region" IN ('Región Metropolitana', 'Metropolitana de Santiago');

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN "solicitudEspera" JSONB,
ADD COLUMN "vistoAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Comuna_region_provincia_idx" ON "Comuna"("region", "provincia");
