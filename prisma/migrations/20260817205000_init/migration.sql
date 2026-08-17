-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('COMPRADOR', 'PROVEEDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModoRubro" AS ENUM ('VENTA', 'CAPTURA');

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('RECIBIDO', 'EN_REVISION', 'VERIFICADO', 'LISTA_ESPERA', 'DESCARTADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoTransicionLead" AS ENUM ('CREADO', 'CUENTA_VINCULADA', 'EN_LISTA_ESPERA', 'ENVIADO_A_REVISION', 'RUT_VALIDADO', 'TELEFONO_VERIFICADO', 'VERIFICADO', 'DESCARTADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "ActorTransicion" AS ENUM ('SISTEMA', 'COMPRADOR', 'PROVEEDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('NO_RECLAMADO', 'PENDIENTE', 'APROBADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "TipoCompraLead" AS ENUM ('EXCLUSIVO', 'COMPARTIDO');

-- CreateEnum
CREATE TYPE "EstadoCompraLead" AS ENUM ('PAGADA', 'REVERSADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoCreditos" AS ENUM ('COMPRA_PACK', 'CONSUMO_LEAD', 'REVERSA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "OrigenSolicitudRubro" AS ENUM ('COTIZADOR', 'PROVEEDOR');

-- CreateEnum
CREATE TYPE "TipoEventoAnalitica" AS ENUM ('VISITA_PAGINA', 'FORM_START', 'LEAD_CREADO', 'CUENTA_CREADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'COMPRADOR',
    "passwordHash" TEXT,
    "telefonoE164Verificado" TEXT,
    "telefonoVerificadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Rubro" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombrePlural" TEXT,
    "descripcion" TEXT,
    "modo" "ModoRubro" NOT NULL DEFAULT 'CAPTURA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "precioExclusivoClp" INTEGER,
    "precioCompartidoClp" INTEGER,
    "camposFormulario" JSONB NOT NULL DEFAULT '[]',
    "contenidoSeo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comuna" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubroComuna" (
    "id" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,
    "comunaId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "contenido" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RubroComuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT,
    "rutNormalizado" TEXT,
    "email" TEXT,
    "telefonoE164" TEXT,
    "descripcion" TEXT,
    "sitioWeb" TEXT,
    "estado" "EstadoProveedor" NOT NULL DEFAULT 'NO_RECLAMADO',
    "comunaBaseId" TEXT,
    "usuarioId" TEXT,
    "autoCompra" BOOLEAN NOT NULL DEFAULT false,
    "topeMensualClp" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobertura" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,
    "comunaId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "filtrosJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobertura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,
    "comunaId" TEXT NOT NULL,
    "estado" "EstadoLead" NOT NULL DEFAULT 'RECIBIDO',
    "score" INTEGER NOT NULL DEFAULT 0,
    "datos" JSONB NOT NULL DEFAULT '{}',
    "modoRubroAlCrear" "ModoRubro" NOT NULL,
    "rutValido" BOOLEAN NOT NULL DEFAULT false,
    "telefonoVerificado" BOOLEAN NOT NULL DEFAULT false,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "compradorUsuarioId" TEXT,
    "claimTokenHash" TEXT,
    "origen" TEXT,
    "utm" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificadoAt" TIMESTAMP(3),
    "archivadoAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadContacto" (
    "leadId" TEXT NOT NULL,
    "nombreContacto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefonoE164" TEXT NOT NULL,
    "rutNormalizado" TEXT NOT NULL,
    "razonSocial" TEXT,
    "detalle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadContacto_pkey" PRIMARY KEY ("leadId")
);

-- CreateTable
CREATE TABLE "TransicionLead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" "TipoTransicionLead" NOT NULL,
    "estadoDesde" "EstadoLead",
    "estadoHasta" "EstadoLead" NOT NULL,
    "actor" "ActorTransicion" NOT NULL DEFAULT 'SISTEMA',
    "actorUsuarioId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransicionLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificacionOtp" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "leadId" TEXT,
    "telefonoE164" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "expiraAt" TIMESTAMP(3) NOT NULL,
    "consumidoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificacionOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraLead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "tipo" "TipoCompraLead" NOT NULL,
    "precioClp" INTEGER NOT NULL,
    "creditosConsumidos" INTEGER NOT NULL,
    "estado" "EstadoCompraLead" NOT NULL DEFAULT 'PAGADA',
    "contactoReveladoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompraLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCreditos" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "tipo" "TipoMovimientoCreditos" NOT NULL,
    "montoCreditos" INTEGER NOT NULL,
    "saldoPosterior" INTEGER NOT NULL,
    "compraLeadId" TEXT,
    "idempotencyKey" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCreditos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudRubro" (
    "id" TEXT NOT NULL,
    "textoRubro" TEXT NOT NULL,
    "origen" "OrigenSolicitudRubro" NOT NULL,
    "comunaId" TEXT,
    "usuarioId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudRubro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoAnalitica" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEventoAnalitica" NOT NULL,
    "rubroId" TEXT,
    "comunaId" TEXT,
    "leadId" TEXT,
    "usuarioId" TEXT,
    "sesionAnonId" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAnalitica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_telefonoE164Verificado_idx" ON "User"("telefonoE164Verificado");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Rubro_slug_key" ON "Rubro"("slug");

-- CreateIndex
CREATE INDEX "Rubro_modo_activo_idx" ON "Rubro"("modo", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "Comuna_slug_key" ON "Comuna"("slug");

-- CreateIndex
CREATE INDEX "RubroComuna_comunaId_idx" ON "RubroComuna"("comunaId");

-- CreateIndex
CREATE UNIQUE INDEX "RubroComuna_rubroId_comunaId_key" ON "RubroComuna"("rubroId", "comunaId");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_slug_key" ON "Proveedor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_rutNormalizado_key" ON "Proveedor"("rutNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_usuarioId_key" ON "Proveedor"("usuarioId");

-- CreateIndex
CREATE INDEX "Proveedor_estado_idx" ON "Proveedor"("estado");

-- CreateIndex
CREATE INDEX "Proveedor_comunaBaseId_idx" ON "Proveedor"("comunaBaseId");

-- CreateIndex
CREATE INDEX "Cobertura_rubroId_comunaId_activa_idx" ON "Cobertura"("rubroId", "comunaId", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "Cobertura_proveedorId_rubroId_comunaId_key" ON "Cobertura"("proveedorId", "rubroId", "comunaId");

-- CreateIndex
CREATE INDEX "Lead_compradorUsuarioId_idx" ON "Lead"("compradorUsuarioId");

-- CreateIndex
CREATE INDEX "Lead_claimTokenHash_idx" ON "Lead"("claimTokenHash");

-- CreateIndex
CREATE INDEX "Lead_estado_createdAt_idx" ON "Lead"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_rubroId_comunaId_createdAt_idx" ON "Lead"("rubroId", "comunaId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadContacto_rutNormalizado_idx" ON "LeadContacto"("rutNormalizado");

-- CreateIndex
CREATE INDEX "LeadContacto_telefonoE164_idx" ON "LeadContacto"("telefonoE164");

-- CreateIndex
CREATE INDEX "LeadContacto_email_idx" ON "LeadContacto"("email");

-- CreateIndex
CREATE INDEX "TransicionLead_leadId_createdAt_idx" ON "TransicionLead"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "TransicionLead_actorUsuarioId_idx" ON "TransicionLead"("actorUsuarioId");

-- CreateIndex
CREATE INDEX "VerificacionOtp_usuarioId_createdAt_idx" ON "VerificacionOtp"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificacionOtp_leadId_idx" ON "VerificacionOtp"("leadId");

-- CreateIndex
CREATE INDEX "CompraLead_proveedorId_createdAt_idx" ON "CompraLead"("proveedorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompraLead_leadId_proveedorId_key" ON "CompraLead"("leadId", "proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoCreditos_idempotencyKey_key" ON "MovimientoCreditos"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MovimientoCreditos_proveedorId_createdAt_idx" ON "MovimientoCreditos"("proveedorId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoCreditos_compraLeadId_idx" ON "MovimientoCreditos"("compraLeadId");

-- CreateIndex
CREATE INDEX "SolicitudRubro_createdAt_idx" ON "SolicitudRubro"("createdAt");

-- CreateIndex
CREATE INDEX "SolicitudRubro_comunaId_idx" ON "SolicitudRubro"("comunaId");

-- CreateIndex
CREATE INDEX "SolicitudRubro_usuarioId_idx" ON "SolicitudRubro"("usuarioId");

-- CreateIndex
CREATE INDEX "SolicitudRubro_leadId_idx" ON "SolicitudRubro"("leadId");

-- CreateIndex
CREATE INDEX "EventoAnalitica_tipo_createdAt_idx" ON "EventoAnalitica"("tipo", "createdAt");

-- CreateIndex
CREATE INDEX "EventoAnalitica_sesionAnonId_idx" ON "EventoAnalitica"("sesionAnonId");

-- CreateIndex
CREATE INDEX "EventoAnalitica_rubroId_idx" ON "EventoAnalitica"("rubroId");

-- CreateIndex
CREATE INDEX "EventoAnalitica_comunaId_idx" ON "EventoAnalitica"("comunaId");

-- CreateIndex
CREATE INDEX "EventoAnalitica_leadId_idx" ON "EventoAnalitica"("leadId");

-- CreateIndex
CREATE INDEX "EventoAnalitica_usuarioId_idx" ON "EventoAnalitica"("usuarioId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubroComuna" ADD CONSTRAINT "RubroComuna_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubroComuna" ADD CONSTRAINT "RubroComuna_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_comunaBaseId_fkey" FOREIGN KEY ("comunaBaseId") REFERENCES "Comuna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_compradorUsuarioId_fkey" FOREIGN KEY ("compradorUsuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadContacto" ADD CONSTRAINT "LeadContacto_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransicionLead" ADD CONSTRAINT "TransicionLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransicionLead" ADD CONSTRAINT "TransicionLead_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificacionOtp" ADD CONSTRAINT "VerificacionOtp_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificacionOtp" ADD CONSTRAINT "VerificacionOtp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraLead" ADD CONSTRAINT "CompraLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraLead" ADD CONSTRAINT "CompraLead_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCreditos" ADD CONSTRAINT "MovimientoCreditos_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCreditos" ADD CONSTRAINT "MovimientoCreditos_compraLeadId_fkey" FOREIGN KEY ("compraLeadId") REFERENCES "CompraLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudRubro" ADD CONSTRAINT "SolicitudRubro_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudRubro" ADD CONSTRAINT "SolicitudRubro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudRubro" ADD CONSTRAINT "SolicitudRubro_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAnalitica" ADD CONSTRAINT "EventoAnalitica_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAnalitica" ADD CONSTRAINT "EventoAnalitica_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAnalitica" ADD CONSTRAINT "EventoAnalitica_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAnalitica" ADD CONSTRAINT "EventoAnalitica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

