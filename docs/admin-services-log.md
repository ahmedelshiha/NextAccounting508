

## [2025-09-25] Documentation updates: todo & log alignment
What I changed:
- Updated docs/admin-services-todo.md to a dependency-ordered, granular checklist with explicit acceptance criteria, measurable outputs, and clear next steps.
- Added migration SQL (prisma/migrations/20250924_add_service_views/migration.sql) and detailed migration/run/rollback instructions in docs/prisma-migration-instructions.md.
- Committed CI workflow (.github/workflows/ci.yml) and unit tests (tests/services.service.test.ts) to ensure analytics and bulk operation math are covered in PR checks.
- Implemented Redis cache wrapper (src/lib/cache/redis.ts) and integrated fallback-aware CacheService (src/lib/cache.service.ts).

Why:
- Improve developer experience and reduce deployment risk by making tasks actionable, adding tests and CI, and providing safe migration instructions.

Next steps:
- Run migration on staging with NETLIFY_DATABASE_URL and validate behavior (manual step).
- Continue test coverage expansion and UI accessibility checks for admin analytics.
- Monitor Netlify deploys and confirm migration success in staging before production.

