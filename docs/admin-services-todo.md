
## Phase 2: Data Architecture Improvements

### 2.1 Database Schema Enhancements (Depends on Phase 1)
- [x] Prisma schema prepared: composite unique `(tenantId, slug)` on `Service`
- [x] Added `serviceSettings Json?` field (default to be handled at DB migration time)
- [x] Extended `ServiceStatus` enum with `DRAFT` and `RETIRED` (kept `INACTIVE` for compatibility)
- [x] Updated seed and public service endpoints to work without slug uniqueness
- [x] Migrate queries from boolean `active` to `status` (begin)
- [x] Apply DB migration in deployment pipeline

  - Completed: Added prisma deploy/seed flow to netlify.toml and retry script (scripts/prisma-deploy-retry.sh) to ensure migrations run during Netlify builds and handle advisory lock contention (2025-09-22).
  - Why: Ensure DB schema changes are applied reliably during CI/CD, avoiding migration failures caused by advisory lock contention.
  - Next steps: Monitor Netlify deploys for migration success, validate on staging, and plan phased production migration and alerting.

### 2.2 Service Layer Business Logic (Depends on 2.1)
- [x] `cloneService(name, fromId)` with slug generation/dedup
- [x] `getServiceVersionHistory(id)` placeholder (returns [])
- [x] `validateServiceDependencies(service)` for future checks
- [x] `bulkUpdateServiceSettings(updates)`
- [x] Strengthen `clearCaches` to cover all keys

### 2.3 Analytics Enhancements (Depends on 2.1)
- [x] Use bookings to compute analytics (no placeholders)
- [x] Time-series grouping for `revenueByService` (per-service monthly series for top services)
- [x] Rank `popularServices` by booking count
- [x] Monthly conversion from views→bookings (implemented via service.views counters)
- [x] Enforce tenant scoping across analytics

  - Completed: Implemented booking-driven analytics in ServicesService.getServiceStats — monthlyBookings, revenueByService, popularServices, conversionRates (booking completion), revenueTimeSeries for top services (last 6 months), and conversionsByService (views→bookings) using new `Service.views` counter. Tenant scoping is applied to booking queries.
  - Why: Provide actionable time-series and ranking data for admin dashboards and to power charts.
  - Next steps: Integrate traffic/view metrics (per-month) for higher-fidelity conversions and expose revenueTimeSeries & conversionsByService to frontend visualizations.
