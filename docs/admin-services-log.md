
## [2025-09-25] Phase 8 — Docs & Monitoring
What I added:
- Expanded OpenAPI spec for Admin Services (HEAD /admin/services, error schema, richer params/responses).
- API route export already available at /api/openapi/admin-services.
- Sentry instrumentation in admin services API (stats + list) to capture handled exceptions.
- Auth/perm errors and rate-limit responses reflected in OpenAPI.
- Wrote cache invalidation guide: docs/admin-services-cache-invalidation.md.

Why:
- Provide consumers with accurate API contract and error shapes.
- Ensure operational visibility by capturing caught exceptions in Sentry.
- Document cache patterns/TTLs to standardize invalidation and ops runbooks.

Next steps:
- Set SENTRY_DSN on Netlify; optionally configure sourcemaps upload.
- Ensure REDIS_URL is set for distributed cache in production.
- Apply/verify Prisma migrations for ServiceView/Service.views in production DB.
