Migration: Add Language Registry Table
Date: 2025-01-01
Status: Part of Phase 1→2 Transition (Task 14.1.1)

CHANGES:
---------
1. Created new "languages" table with:
   - code (VARCHAR(10), PRIMARY KEY) - Language code like 'en', 'ar', 'hi'
   - name (VARCHAR(100)) - English name of language
   - nativeName (VARCHAR(100)) - Native name of language
   - direction (VARCHAR(3)) - Text direction: 'ltr' or 'rtl'
   - flag (VARCHAR(5)) - Unicode flag emoji
   - bcp47Locale (VARCHAR(10)) - BCP47 locale string for Intl API (e.g., 'en-US')
   - enabled (BOOLEAN) - Whether language is available for users
   - createdAt (TIMESTAMP) - Created timestamp
   - updatedAt (TIMESTAMP) - Last updated timestamp

2. Added index on 'enabled' column for fast filtering

3. Seeded default languages:
   - 'en' - English (en-US)
   - 'ar' - Arabic (ar-SA, RTL)
   - 'hi' - Hindi (hi-IN)

RATIONALE:
----------
Moving language configuration from hardcoded enums to database allows:
- Adding new languages without code changes (only JSON + DB insert)
- Admin UI can manage languages (enable/disable, add, remove)
- Enables future features like language-specific settings
- Easier testing with dynamic language configuration
- Future integration with translation platforms (Crowdin, etc.)

BACKWARD COMPATIBILITY:
-----------------------
- Hardcoded fallback lists preserved in language-registry.ts
- If database unavailable, system falls back to hardcoded config
- Existing code using hardcoded VALID_LANGUAGES still works
- Dynamic schema validation available via createPreferencesSchema()

NEW FILES:
----------
- src/lib/language-registry.ts - Language registry service
  * getAllLanguages() - Fetch all languages with caching
  * getEnabledLanguages() - Get only enabled languages
  * getLanguageByCode(code) - Look up specific language
  * upsertLanguage(code, data) - Create/update language
  * deleteLanguage(code) - Delete language (with safety checks)
  * toggleLanguageStatus(code) - Enable/disable language
  * createPreferencesSchema() - Dynamic Zod schema with enabled languages

MIGRATION STEPS:
----------------
1. Run: npm run db:migrate
2. Verify: SELECT * FROM languages;
3. Update components to use language registry (see Phase 2.2)
4. Remove hardcoded enums from i18n.ts, profile constants, etc. (future task)

TESTING:
--------
1. Verify database has 3 default languages
2. Test API validation with hardcoded + dynamic schemas
3. Test language registry caching
4. Test fallback when database unavailable

ROLLBACK:
---------
If needed: npm run db:migrate:resolve
This will mark the migration as failed and create rollback migration.

For manual rollback:
  DROP TABLE IF EXISTS "languages";
