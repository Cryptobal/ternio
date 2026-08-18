/**
 * Migración aditiva: audiencias y precios de hogar.
 * No toca CompraLead ni MovimientoCreditos.
 */

-- AlterTable
ALTER TABLE "Rubro" ADD COLUMN "audiencias" TEXT[] NOT NULL DEFAULT ARRAY['empresa']::TEXT[];

-- AlterTable
ALTER TABLE "Rubro" ADD COLUMN "precioExclusivoHogarClp" INTEGER;

-- AlterTable
ALTER TABLE "Rubro" ADD COLUMN "precioCompartidoHogarClp" INTEGER;

-- AlterTable
ALTER TABLE "Cobertura" ADD COLUMN "audiencias" TEXT[] NOT NULL DEFAULT ARRAY['empresa']::TEXT[];
