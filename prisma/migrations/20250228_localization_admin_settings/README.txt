Migration: Add Organization Localization Settings and Regional Formats Tables
Date: 2025-02-28
Status: Enables Admin Localization Settings Enhanced Features

OVERVIEW:
---------
This migration creates two new tables to support the enhanced localization admin settings interface:
1. org_localization_settings - Organization-wide language configuration
2. regional_formats - Per-language regional format configuration

CHANGES:
--------
1. Created "org_localization_settings" table:
   - id (TEXT, PRIMARY KEY)
   - tenantId (UUID, UNIQUE, FOREIGN KEY to Tenant)
   - defaultLanguage (VARCHAR(10), default: 'en')
   - fallbackLanguage (VARCHAR(10), default: 'en')
   - showLanguageSwitcher (BOOLEAN, default: true)
   - persistLanguagePreference (BOOLEAN, default: true)
   - autoDetectBrowserLanguage (BOOLEAN, default: true)
   - allowUserLanguageOverride (BOOLEAN, default: true)
   - enableRtlSupport (BOOLEAN, default: true)
   - missingTranslationBehavior (VARCHAR(20), default: 'show-fallback')
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)
   
   Indexes:
   - UNIQUE on tenantId (one settings record per tenant)
   - INDEX on tenantId (for lookups)

2. Created "regional_formats" table:
   - id (TEXT, PRIMARY KEY)
   - tenantId (UUID, FOREIGN KEY to Tenant)
   - languageCode (VARCHAR(10))
   - dateFormat (VARCHAR(50))
   - timeFormat (VARCHAR(50))
   - currencyCode (VARCHAR(3))
   - currencySymbol (VARCHAR(10))
   - numberFormat (VARCHAR(50))
   - decimalSeparator (VARCHAR(1))
   - thousandsSeparator (VARCHAR(1))
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)
   
   Constraints:
   - UNIQUE on (tenantId, languageCode) - one format per language per tenant
   
   Indexes:
   - INDEX on tenantId (for lookups)
   - INDEX on languageCode (for lookups)

RATIONALE:
----------
These tables enable:
- Persistent storage of organization-wide localization settings
- Per-language regional format configuration (dates, times, currency)
- Multi-tenant support (each tenant has independent settings)
- Clean separation of concerns (settings separate from language definitions)
- Audit trail via createdAt/updatedAt timestamps
- Fast lookups via strategic indexing

BACKWARD COMPATIBILITY:
-----------------------
- No existing tables modified
- No data loss or migration required
- API endpoints have default fallbacks if records don't exist
- Safe for existing tenants (settings will be created on first request)

DATABASE SETUP:
---------------
1. Run migration: npm run db:migrate
2. Verify tables created: psql -c "\dt org_localization_settings, regional_formats"
3. No seeding needed - defaults are used until configured

API INTEGRATION:
----------------
Updated API endpoints now persist to database:
- GET /api/admin/org-settings/localization (reads from DB)
- PUT /api/admin/org-settings/localization (writes to DB)
- GET /api/admin/regional-formats (reads from DB)
- PUT /api/admin/regional-formats (writes to DB)

TESTING:
--------
1. Verify tables exist in database
2. Test creating org settings record via API
3. Test creating regional format records via API
4. Verify unique constraints work (can't have duplicate tenantId/languageCode)
5. Verify indexes are created
6. Test cascading delete when tenant is deleted

ROLLBACK:
---------
If needed: npm run db:migrate:resolve
This will mark migration as failed and create rollback.

For manual rollback:
  DROP TABLE IF EXISTS "regional_formats";
  DROP TABLE IF EXISTS "org_localization_settings";

NOTES:
------
- These tables follow the standard pattern of other settings tables (SecuritySettings, CommunicationSettings, etc.)
- Tenant isolation is enforced via foreign key
- All columns use sensible defaults to allow gradual adoption
- Future enhancements can add more fields to these tables without schema conflicts

DEPENDENCIES:
--------------
- Requires Prisma schema update with OrganizationLocalizationSettings and RegionalFormat models
- Requires API route updates to use database instead of in-memory defaults
- Completes the foundation for analytics and Crowdin integration
