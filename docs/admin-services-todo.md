# Services Management System ��� Implementation Plan

Last updated: 2025-09-22

Status
- [x] Architecture audit documented in `docs/admin-services-audit.md`
- [x] Implementation plan created and organized with dependencies and checklists
- [ ] Phase 1 in progress

Note: Always review this file before coding. Keep tasks production-grade and deployment-ready.

## Phase 1: Foundation & Type Consistency

### 1.1 Type System Unification (Immediate)
- [x] Remove duplicate `Service` and `ServiceStats` from `@/app/admin/services/page.tsx`
- [x] Import shared types from `@/types/services.ts`
- [x] Replace local filter state type with `ServiceFilters` (moved sortBy/sortOrder to dedicated state)
- [x] Align component props to shared types (cards, forms, filters, header)
- [x] Run `pnpm run typecheck` and fix conflicts

### 1.2 UI Component Consolidation (Depends on 1.1)
- [x] Replace inline filters with `@/components/admin/services/ServicesFilters`
- [x] Replace custom header with `@/components/admin/services/ServicesHeader`
- [x] Replace ad-hoc analytics with `@/components/admin/services/ServicesAnalytics`
- [x] Adjust state wiring to consolidated components
- [x] Verify UX parity: search, filters, toggles, pagination, modals

### 1.3 Schema Validation Consolidation (Depends on 1.1)
- [x] Move image URL checks into Zod using `z.preprocess`/refinement in `@/schemas/services`
- [x] Keep `sanitizeServiceData` transform-only (no validation)
- [x] Ensure all routes validate via Zod exclusively
- [x] Remove duplicate validations in utils

## Phase 2: Data Architecture Improvements

### 2.1 Database Schema Enhancements (Depends on Phase 1)
- [ ] Prisma migration: composite unique `(tenantId, slug)` on `Service`
- [ ] Update `validateSlugUniqueness` to be tenant-scoped
- [ ] Add `serviceSettings JSONB` with default `{}`
- [ ] Add `status` enum: `draft|active|deprecated|retired`
- [ ] Migrate queries from boolean `active` to `status`

### 2.2 Service Layer Business Logic (Depends on 2.1)
- [ ] `cloneService(name, fromId)` with slug generation/dedup
- [ ] `getServiceVersionHistory(id)` placeholder (returns [])
- [ ] `validateServiceDependencies(service)` for future checks
- [ ] `bulkUpdateServiceSettings(updates)`
- [ ] Strengthen `clearCaches` to cover all keys

### 2.3 Analytics Enhancements (Depends on 2.1)
- [ ] Use bookings to compute analytics (no placeholders)
- [ ] Time-series grouping for `revenueByService`
- [ ] Rank `popularServices` by booking count
- [ ] Monthly conversion from views→bookings
- [ ] Enforce tenant scoping across analytics

## Phase 3: API Layer Hardening

### 3.1 Error Handling Standardization (Depends on Phase 2)
- [ ] Create `@/lib/api/error-responses.ts` with `{ code, message, details? }`
- [ ] Return structured errors in all service routes
- [ ] Error codes: `SLUG_CONFLICT`, `VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHORIZED`
- [ ] Consistent 409 handling for slug conflicts
- [ ] Contextual error logging

### 3.2 New API Endpoints (Depends on 3.1)
- [ ] POST `/api/admin/services/[id]/clone`
- [ ] HEAD `/api/admin/services`
- [ ] GET `/api/admin/services/[id]/versions`
- [ ] PATCH `/api/admin/services/[id]/settings`
- [ ] GET `/api/admin/services/slug-check/[slug]`

### 3.3 Enhanced Bulk Operations (Depends on 3.1)
- [ ] Add `clone` to `BulkActionSchema`
- [ ] Add `settings-update` bulk action
- [ ] Progress tracking for >50 items
- [ ] Rollback on failures
- [ ] Per-item error details in results

## Phase 4: Performance & Caching

### 4.1 Cache System Upgrade (Depends on Phase 2)
- [ ] Add Redis client (e.g., `@upstash/redis`)
- [ ] `@/lib/cache/redis.ts` connection wrapper
- [ ] Swap in Redis-backed CacheService
- [ ] Key patterns: `service:${tenantId}:${id}`, `services-list:${tenantId}:${hash}`
- [ ] Implement `deletePattern` safely

### 4.2 ETag and Perf Optimization (Depends on 4.1)
- [ ] Optimize/weak ETags for lists
- [ ] Add `Last-Modified` for single resources
- [ ] Cache warming for hot paths
- [ ] Measure cache hit/miss

### 4.3 Fallback Behavior Documentation (Depends on 4.1)
- [ ] Feature flag `ENABLE_FALLBACK_QUERIES`
- [ ] Document fallback in `getServicesList`
- [ ] Telemetry when fallback used
- [ ] Alerting on excessive fallbacks
- [ ] Keep parity with main query logic

## Phase 5: Integration & Event System

### 5.1 Service Change Notifications (Depends on Phase 4)
- [ ] `@/lib/events/service-events.ts` with typed events
- [ ] Publish events on status/price/category changes
- [ ] Cross-module listeners for cache invalidation
- [ ] Webhooks for external systems
- [ ] Audit trail with before/after snapshots

### 5.2 Downstream Integration (Depends on 5.1)
- [ ] Add `ServiceLite` DTO (`id,name,price,duration,active`)
- [ ] Booking wizard consumes `ServiceLite`
- [ ] SR forms validate against current service status
- [ ] Availability check in booking flow
- [ ] Block new bookings on deactivated services

### 5.3 Multi-module Cache Coordination (Depends on 5.1)
- [ ] Inventory all service-data caches
- [ ] Cross-module invalidation wiring
- [ ] Booking/availability refresh triggers
- [ ] Dependency map for invalidation
- [ ] Consistency tests across lifecycle

## Phase 6: Security & Rate Limiting

### 6.1 Granular Permissions (Parallel)
- [ ] Add: `MANAGE_FEATURED`, `BULK_OPERATIONS`, `VIEW_ANALYTICS`
- [ ] Update `useServicesPermissions` accordingly
- [ ] Permission audit logs for sensitive ops
- [ ] Tenant-admin role and settings permissions

### 6.2 Rate Limiting (Depends on 6.1)
- [ ] Tenant-scoped keys: `services:${tenantId}:${operation}`
- [ ] Per-operation limits (list/create/bulk)
- [ ] Internal bypass
- [ ] Rate limit headers: `X-RateLimit-*`
- [ ] Backoff guidance in 429 responses

### 6.3 CSV Export Security (Parallel)
- [ ] Prefix dangerous cells with `'`
- [ ] Sanitize `= + - @` formula starters
- [ ] Export audit logging with user id
- [ ] CSV size limits (≤10k rows)
- [ ] Throttle exports (≤3/hour/user)

## Phase 7: Testing & QA

### 7.1 Service Layer Unit Tests (Depends on Phase 2)
- [ ] CRUD tests for `services.service.ts`
- [ ] Bulk edge cases
- [ ] Cache invalidation (Redis mock)
- [ ] Analytics math using sample bookings
- [ ] Tenant isolation tests

### 7.2 API Integration Tests (Depends on Phase 3)
- [ ] Route tests for all endpoints
- [ ] Auth/permission tests
- [ ] Error scenarios (validation, not found, conflicts)
- [ ] Rate limit concurrency tests
- [ ] Bulk with 500+ services

### 7.3 Component Tests (Depends on Phase 1)
- [ ] `ServiceForm` validation cases
- [ ] `BulkActionsPanel` action coverage
- [ ] `ServicesFilters` filter combinations
- [ ] Permission-based UI visibility
- [ ] Accessibility checks

## Phase 8: Documentation & Monitoring

### 8.1 Technical Documentation (Depends on previous phases)
- [ ] OpenAPI spec for service endpoints
- [ ] Fallback query behavior docs
- [ ] Cache invalidation strategy
- [ ] Troubleshooting guide
- [ ] Service events & integration patterns

### 8.2 Operational Monitoring (Depends on 4 & 5)
- [ ] Ops metrics (create/update/delete rates)
- [ ] Cache performance dashboards
- [ ] Alerts (API errors, cache misses, fallbacks)
- [ ] Data integrity monitors
- [ ] Performance dashboards

### 8.3 UX Documentation (Parallel)
- [ ] Admin guide for services workflows
- [ ] Bulk operations safety guidelines
- [ ] Configuration recommendations by business type
- [ ] Video tutorials for complex setups
- [ ] Contextual help tooltips

---

Totals
- Total Tasks: 89
- Critical Path: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
- Estimated Timeline: 10–14 weeks
- Parallel Tracks: Phase 6 and Phase 8.3 can start early
