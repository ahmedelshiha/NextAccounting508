-- Create OrganizationLocalizationSettings table
CREATE TABLE IF NOT EXISTS "org_localization_settings" (
  id TEXT PRIMARY KEY,
  "tenantId" UUID NOT NULL UNIQUE,
  "defaultLanguage" VARCHAR(10) NOT NULL DEFAULT 'en',
  "fallbackLanguage" VARCHAR(10) NOT NULL DEFAULT 'en',
  "showLanguageSwitcher" BOOLEAN NOT NULL DEFAULT true,
  "persistLanguagePreference" BOOLEAN NOT NULL DEFAULT true,
  "autoDetectBrowserLanguage" BOOLEAN NOT NULL DEFAULT true,
  "allowUserLanguageOverride" BOOLEAN NOT NULL DEFAULT true,
  "enableRtlSupport" BOOLEAN NOT NULL DEFAULT true,
  "missingTranslationBehavior" VARCHAR(20) NOT NULL DEFAULT 'show-fallback',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT org_localization_settings_tenantId_key UNIQUE ("tenantId")
);

CREATE INDEX IF NOT EXISTS "org_localization_settings_tenantId_idx" ON "org_localization_settings"("tenantId");

-- Create RegionalFormat table
CREATE TABLE IF NOT EXISTS "regional_formats" (
  id TEXT PRIMARY KEY,
  "tenantId" UUID NOT NULL,
  "languageCode" VARCHAR(10) NOT NULL,
  "dateFormat" VARCHAR(50) NOT NULL,
  "timeFormat" VARCHAR(50) NOT NULL,
  "currencyCode" VARCHAR(3) NOT NULL,
  "currencySymbol" VARCHAR(10) NOT NULL,
  "numberFormat" VARCHAR(50) NOT NULL,
  "decimalSeparator" VARCHAR(1) NOT NULL,
  "thousandsSeparator" VARCHAR(1) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT regional_formats_tenantId_languageCode_key UNIQUE ("tenantId", "languageCode")
);

CREATE INDEX IF NOT EXISTS "regional_formats_tenantId_idx" ON "regional_formats"("tenantId");
CREATE INDEX IF NOT EXISTS "regional_formats_languageCode_idx" ON "regional_formats"("languageCode");

-- Seed default regional formats for standard languages (en, ar, hi)
-- These will be created for each tenant when they're first accessed
