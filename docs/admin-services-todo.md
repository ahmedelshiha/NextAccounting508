# Services Management System Implementation Plan

Last updated: 2025-09-22

Based on Current Architecture Analysis

## Phase 1: Foundation & Type Consistency

### 1.1 Type System Unification (Immediate - No Dependencies)
- Remove duplicate Service and ServiceStats interfaces from `@/app/admin/services/page.tsx`
- Import all types from `@/types/services.ts` in admin page component
- Update admin page to use `ServiceFilters` type instead of local filter state
- Verify all component props match imported types from `@/types/services.ts`
- Run TypeScript compilation to ensure no type conflicts remain

### 1.2 UI Component Consolidation (Depends on 1.1)
- Replace inline filter controls in `page.tsx` with `@/components/admin/services/ServicesFilters`
- Replace custom header implementation with `@/components/admin/services/ServicesHeader`
- Remove duplicate analytics snippets and use `@/components/admin/services/ServicesAnalytics`
- Update admin page state management to work with consolidated components
- Test all existing functionality works with shared components

### 1.3 Schema Validation Consolidation (Depends on 1.1)
- Move URL validation logic from `sanitizeServiceData` into Zod schema using `z.preprocess`
- Add image URL validation as Zod refinement in `ServiceSchema`
- Update `sanitizeServiceData` to only handle data transformation, not validation
- Ensure all API routes use consolidated validation approach
- Remove duplicate validation logic between Zod and sanitization functions

## Phase 2: Data Architecture Improvements

### 2.1 Database Schema Enhancements (Depends on Phase 1)
- Create migration to add composite unique index `(tenantId, slug)` on Service table
- Update `validateSlugUniqueness` function to check tenant-scoped uniqueness
- Add `serviceSettings` JSONB column to Service model with default `{}`
- Create migration to add `status` enum field [`draft`, `active`, `deprecated`, `retired`]
- Update all queries to use `status` instead of boolean `active` field

### 2.2 Service Layer Business Logic (Depends on 2.1)
- Add `cloneService` method to `@/services/services.service.ts` with slug generation
- Implement `getServiceVersionHistory` placeholder method (returns empty array initially)
- Add `validateServiceDependencies` method for future prerequisite checking
- Create `bulkUpdateServiceSettings` method for configuration changes
- Update `clearCaches` to invalidate all related cache keys properly

### 2.3 Analytics Implementation Enhancement (Depends on 2.1)
- Fix `getServiceStats` to return actual booking-based analytics instead of placeholders
- Add time-series data collection for `revenueByService` with proper date grouping
- Implement `popularServices` ranking based on booking frequency
- Add monthly conversion calculation from service views to bookings
- Ensure analytics respects tenant scoping in all calculations

## Phase 3: API Layer Hardening

### 3.1 Error Handling Standardization (Depends on Phase 2)
- Create `@/lib/api/error-responses.ts` with structured error shapes including codes
- Update all service API routes to return structured errors: `{ code, message, details? }`
- Add specific error codes: `SLUG_CONFLICT`, `VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHORIZED`
- Implement consistent 409 error handling for slug conflicts in create and update
- Add proper error logging with request context for debugging

### 3.2 New API Endpoints (Depends on 3.1)
- Create `POST /api/admin/services/[id]/clone` endpoint using new `cloneService` method
- Add `HEAD /api/admin/services` for cache validation without payload download
- Implement `GET /api/admin/services/[id]/versions` returning empty array initially
- Create `PATCH /api/admin/services/[id]/settings` for settings-only updates
- Add `GET /api/admin/services/slug-check/[slug]` for real-time slug availability

### 3.3 Enhanced Bulk Operations (Depends on 3.1)
- Add `clone` action to `BulkActionSchema` with validation
- Implement `settings-update` bulk action for configuration changes
- Add progress tracking for bulk operations affecting >50 services
- Create rollback capability for failed bulk operations
- Add detailed error reporting per service in bulk operation results

## Phase 4: Performance & Caching

### 4.1 Cache System Upgrade (Depends on Phase 2)
- Install Redis client (e.g., `@upstash/redis` for Netlify compatibility)
- Create `@/lib/cache/redis.ts` with connection management
- Replace in-memory `CacheService` with Redis-backed implementation
- Implement cache key patterns: `service:${tenantId}:${id}`, `services-list:${tenantId}:${hash}`
- Add proper `deletePattern` implementation for cache invalidation

### 4.2 ETag and Performance Optimization (Depends on 4.1)
- Optimize ETag generation for service lists to avoid expensive hashing
- Implement weak ETags for list responses with version-based generation
- Add `Last-Modified` headers for individual service resources
- Create cache warming strategy for frequently accessed service data
- Add performance monitoring for cache hit/miss rates

### 4.3 Fallback Behavior Documentation (Depends on 4.1)
- Add feature flag `ENABLE_FALLBACK_QUERIES` for raw SQL fallback mode
- Document when and why fallback queries are used in `getServicesList`
- Add telemetry/logging when fallback mode is activated
- Create monitoring alerts for excessive fallback usage
- Ensure fallback behavior matches main query logic exactly

## Phase 5: Integration & Event System

### 5.1 Service Change Notification System (Depends on Phase 4)
- Create `@/lib/events/service-events.ts` with typed event definitions
- Implement event publishing in service layer for status/price/category changes
- Add event listeners for cache invalidation across related modules
- Create webhook system for external integrations (booking systems, etc.)
- Add service change audit trail with before/after snapshots

### 5.2 Downstream Integration Improvements (Depends on 5.1)
- Create `ServiceLite` DTO with only `id, name, price, duration, active`
- Update booking wizard to consume `ServiceLite` instead of full service objects
- Modify service request forms to validate against current service status
- Add service availability checking in booking flow
- Ensure service deactivation prevents new bookings immediately

### 5.3 Multi-module Cache Coordination (Depends on 5.1)
- Identify all modules that cache service data (booking, availability, requests)
- Implement cache invalidation notifications across module boundaries
- Add service data refresh triggers in booking and availability managers
- Create service dependency mapping for complex cache invalidation
- Test cache consistency across service lifecycle operations

## Phase 6: Security & Rate Limiting

### 6.1 Enhanced Permission System (No Dependencies - Can Run in Parallel)
- Add granular service permissions: `MANAGE_FEATURED`, `BULK_OPERATIONS`, `VIEW_ANALYTICS`
- Update `useServicesPermissions` hook to check new granular permissions
- Add permission audit logging for sensitive operations (bulk delete, pricing changes)
- Implement tenant-admin role with service-specific permissions
- Add permission checks for service settings modifications

### 6.2 Rate Limiting Improvements (Depends on 6.1)
- Implement tenant-based rate limiting keys: `services:${tenantId}:${operation}`
- Add different rate limits for different operations (list vs create vs bulk)
- Create rate limit bypass for internal system operations
- Add rate limit headers in all API responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)
- Implement exponential backoff suggestions in rate limit responses

### 6.3 CSV Export Security (No Dependencies - Can Run in Parallel)
- Add CSV injection protection by prefixing dangerous cells with `'`
- Implement cell content sanitization for formulas starting with `=`, `+`, `-`, `@`
- Add CSV export audit logging with user identification
- Create size limits for CSV exports (max 10,000 services per export)
- Add export request throttling (max 3 exports per hour per user)

## Phase 7: Testing & Quality Assurance

### 7.1 Service Layer Unit Tests (Depends on Phase 2)
- Create comprehensive test suite for `@/services/services.service.ts` CRUD operations
- Add tests for bulk operations with edge cases (empty arrays, invalid IDs)
- Test cache invalidation logic with Redis mock
- Add analytics calculation tests with sample booking data
- Test tenant isolation in all service operations

### 7.2 API Route Integration Tests (Depends on Phase 3)
- Create test suite for all `/api/admin/services/*` endpoints with test database
- Add authentication and permission tests for each endpoint
- Test error handling scenarios (invalid data, missing resources, conflicts)
- Add rate limiting tests with multiple concurrent requests
- Test bulk operations with large datasets (500+ services)

### 7.3 Component Tests (Depends on Phase 1)
- Add React Testing Library tests for `ServiceForm` validation scenarios
- Test `BulkActionsPanel` with various selection and action combinations
- Add `ServicesFilters` component tests with filter combinations
- Test permission-based UI hiding/showing in all components
- Add accessibility tests for all service management components

## Phase 8: Documentation & Monitoring

### 8.1 Technical Documentation (Depends on All Previous Phases)
- Create OpenAPI specification for all service management endpoints
- Document fallback query behavior and when it's triggered
- Write cache invalidation strategy documentation
- Create troubleshooting guide for common service management issues
- Document service event system and integration patterns

### 8.2 Operational Monitoring (Depends on Phase 4, 5)
- Add service operation metrics (create/update/delete rates)
- Implement cache performance monitoring (hit rates, invalidation frequency)
- Create alerts for service system health (API errors, cache misses, fallback usage)
- Add service data integrity monitoring (orphaned references, invalid states)
- Create performance dashboards for service management operations

### 8.3 User Experience Documentation (Can Run in Parallel)
- Create admin user guide for service management workflows
- Write bulk operations safety guidelines and best practices
- Document service configuration recommendations by business type
- Create video tutorials for complex service setup scenarios
- Add contextual help tooltips throughout service management interface

---

- Total Tasks: 89
- Critical Path: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
- Estimated Timeline: 10–14 weeks
- Parallel Work Possible: Phase 6 (Security) and Phase 8.3 (UX Docs) can start early

Priority Focus Areas:
- Phase 1 — Fix immediate code duplication and type safety issues
- Phase 2 — Establish proper data foundation and analytics
- Phase 4 — Critical for production scalability (Redis caching)
- Phase 5 — Ensures system integration works properly
