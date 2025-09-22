## [2025-09-25] Netlify build enhancements and caching status
What I changed:
- Enhanced Netlify build to run lint, typecheck, and vitest before Next.js build across production, deploy-preview, and branch deploy contexts.
- Marked Phase 4 caching tasks (Redis wrapper, CacheService integration, safe deletePattern) as completed in docs/admin-services-todo.md.

Why:
- Ensure production deploys fail fast on type errors or failing tests and maintain consistent code quality without GitHub CI.
- Reflect actual implementation status of caching infrastructure.

Next steps:
- Prepare/commit Prisma migration artifact for ServiceView/views or continue using db push fallback until DB creds are available.
- Proceed to UI accessibility verification for analytics components and expand unit tests for edge cases.

## [2025-09-25] ETag/Last-Modified for services endpoints
What I changed:
- Added ETag and Last-Modified with 304 handling to GET /api/admin/services/[id]. Lists already returned ETag; now singles are cache-friendly too.

Why:
- Reduce bandwidth and speed up admin UI by leveraging conditional requests.

## [2025-09-25] Service events, list caching, and cache warming
What I changed:
- Implemented typed service events bus at src/lib/events/service-events.ts with EventEmitter wrapper.
- Registered default listeners to invalidate caches and asynchronously warm hot paths (services lists and stats) per tenant.
- Emitted events from ServicesService on create/update/delete/clone/bulk operations.
- Added short-lived (60s) caching for getServicesList keyed by tenant+filters; integrated invalidation.

Why:
- Decouple side effects (cache invalidation/warming) from service mutations and enable future observers.
- Reduce list load latency and stabilize response times under burst by caching and warming common queries.

Next steps:
- Add unit/integration tests for events emission and cache behavior.
- Consider expanding warmed combinations based on real traffic and add observability around hit ratios.
