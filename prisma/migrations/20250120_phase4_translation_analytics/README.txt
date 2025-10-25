Migration: 20250120_phase4_translation_analytics

Purpose: Add TranslationKey and TranslationMetrics models for Phase 4 analytics and automation

Changes:
1. TranslationKey table (translation_keys)
   - Stores all discovered translation keys in codebase
   - Tracks translation status per language (en, ar, hi)
   - Namespace auto-extracted from key prefix for analytics
   - Unique constraint on (tenantId, key) to prevent duplicates

2. TranslationMetrics table (translation_metrics)
   - Daily snapshot of translation coverage metrics
   - Stores coverage % per language
   - Tracks user distribution by language preference
   - Unique constraint on (tenantId, date) for daily rollups

Indexes created for:
- Fast queries by namespace and translation status
- Efficient daily metrics retrieval
- Time-based trending analysis

Dependencies:
- Requires Tenant model (already exists in schema)

Rollback: 
- Tables and indexes will be dropped on prisma migrate resolve --rolled-back <migration-name>
