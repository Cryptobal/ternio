-- AlterEnum
ALTER TYPE "TipoEventoAnalitica" ADD VALUE 'LEAD_AVISADO';

-- CreateTable
CREATE TABLE "ParametroAdmin" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametroAdmin_pkey" PRIMARY KEY ("clave")
);
