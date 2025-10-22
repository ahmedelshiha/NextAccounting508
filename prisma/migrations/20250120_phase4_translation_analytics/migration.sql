-- CreateTable translation_keys
CREATE TABLE "translation_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namespace" TEXT,
    "enTranslated" BOOLEAN NOT NULL DEFAULT true,
    "arTranslated" BOOLEAN NOT NULL DEFAULT false,
    "hiTranslated" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable translation_metrics
CREATE TABLE "translation_metrics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "enTotal" INTEGER NOT NULL DEFAULT 0,
    "enTranslated" INTEGER NOT NULL DEFAULT 0,
    "arTotal" INTEGER NOT NULL DEFAULT 0,
    "arTranslated" INTEGER NOT NULL DEFAULT 0,
    "hiTotal" INTEGER NOT NULL DEFAULT 0,
    "hiTranslated" INTEGER NOT NULL DEFAULT 0,
    "totalUniqueKeys" INTEGER NOT NULL DEFAULT 0,
    "usersWithArabic" INTEGER NOT NULL DEFAULT 0,
    "usersWithHindi" INTEGER NOT NULL DEFAULT 0,
    "usersWithEnglish" INTEGER NOT NULL DEFAULT 0,
    "enCoveragePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "arCoveragePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "hiCoveragePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex translation_keys indexes
CREATE INDEX "translation_keys_tenantId_namespace_idx" ON "translation_keys"("tenantId", "namespace");
CREATE INDEX "translation_keys_tenantId_enTranslated_idx" ON "translation_keys"("tenantId", "enTranslated");
CREATE INDEX "translation_keys_tenantId_arTranslated_idx" ON "translation_keys"("tenantId", "arTranslated");
CREATE INDEX "translation_keys_tenantId_hiTranslated_idx" ON "translation_keys"("tenantId", "hiTranslated");
CREATE INDEX "translation_keys_addedAt_idx" ON "translation_keys"("addedAt");
CREATE UNIQUE INDEX "translation_keys_tenantId_key_key" ON "translation_keys"("tenantId", "key");

-- CreateIndex translation_metrics indexes
CREATE UNIQUE INDEX "translation_metrics_tenantId_date_key" ON "translation_metrics"("tenantId", "date");
CREATE INDEX "translation_metrics_tenantId_date_idx" ON "translation_metrics"("tenantId", "date");
CREATE INDEX "translation_metrics_date_idx" ON "translation_metrics"("date");

-- AddForeignKey translation_keys
ALTER TABLE "translation_keys" ADD CONSTRAINT "translation_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey translation_metrics
ALTER TABLE "translation_metrics" ADD CONSTRAINT "translation_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
