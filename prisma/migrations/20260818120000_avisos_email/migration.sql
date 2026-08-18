-- AlterEnum
ALTER TYPE "TipoEventoAnalitica" ADD VALUE IF NOT EXISTS 'AVISO_LEAD_A_VENTA';
ALTER TYPE "TipoEventoAnalitica" ADD VALUE IF NOT EXISTS 'AVISO_LEAD_TOMADO';

-- AlterTable
ALTER TABLE "EventoAnalitica" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "EventoAnalitica_idempotencyKey_key" ON "EventoAnalitica"("idempotencyKey");
