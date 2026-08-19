-- Aditivo: primer toque de alta del proveedor (UTM de /proveedores).
-- Nullable; altas previas quedan null (directo). Sin backfill ni DROP.

ALTER TABLE "Proveedor" ADD COLUMN "origenAlta" TEXT;
