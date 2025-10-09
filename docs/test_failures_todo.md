# Test Failures TODO - Action Items

## Summary
**Total Tests:** 332 tests across multiple suites  
**Failed:** 73 tests  
**Passed:** 259 tests  
**Test Run Date:** October 9, 2025

---

## 🔴 Critical Issues (Blocking Core Functionality)

### 1. Tenant Context Missing in Service Creation
**Priority:** P0 - Critical  
**Files Affected:**
- `src/services/services.service.ts:231`
- `src/app/api/admin/services/route.ts:118`

**Failed Tests:**
- ✗ `tests/admin-services.route.test.ts` - POST creates a new service
- ✗ `tests/e2e/admin-services.crud.smoke.test.ts` - E2E smoke test

**Error:** `Tenant context required to create service`

**Action Items:**
- [ ] Add tenant context injection in service creation flow
- [ ] Ensure `withTenantContext` middleware is properly applied
- [ ] Add tenant validation before service operations
- [ ] Update service creation tests to provide tenant context

---

### 2. Rate Limit Mock Configuration Issues
**Priority:** P0 - Critical  
**Files Affected:**
- `@/lib/rate-limit` mock

**Failed Tests:**
- ✗ `tests/admin-service-requests.route.test.ts` (2 tests)
- ✗ `tests/admin-service-requests.export.test.ts` (2 tests)
- ✗ `tests/admin-service-requests.booking.test.ts`
- ✗ `tests/e2e/admin-service-requests-assign-status.smoke.test.ts`

**Error:** `No "applyRateLimit" export is defined on the "@/lib/rate-limit" mock`

**Action Items:**
- [ ] Fix rate-limit mock in test setup
- [ ] Add proper mock implementation using `vi.importActual`
- [ ] Update all affected test files with proper mock pattern:
  ```typescript
  vi.mock("@/lib/rate-limit", async () => {
    const actual = await vi.importActual("@/lib/rate-limit")
    return {
      ...actual,
      applyRateLimit: vi.fn()
    }
  })
  ```

---

### 3. Prisma Mock Issues
**Priority:** P0 - Critical  
**Files Affected:**
- `@/lib/prisma` mock
- `src/app/api/admin/team-management/route.ts:29`

**Failed Tests:**
- ✗ `tests/admin-rbac-comprehensive.test.ts` - team-management routes
- ✗ `tests/unit/portal-comments-chat.test.ts`

**Error:** `Cannot read properties of undefined (reading 'findMany')` / `No "default" export`

**Action Items:**
- [ ] Fix Prisma client mock exports
- [ ] Ensure proper default export in mock
- [ ] Add proper method mocks (findMany, create, update, etc.)
- [ ] Verify all Prisma operations have fallback handling

---

## 🟡 High Priority Issues (Major Features Affected)

### 4. Authentication & Authorization Issues
**Priority:** P1 - High  
**Files Affected:**
- Authentication middleware
- RBAC enforcement

**Failed Tests:**
- ✗ `tests/integration/http-server.test.ts` - DELETE /api/bookings/:id returns 401
- ✗ `tests/status-transitions.test.ts` (4 tests)
- ✗ `tests/booking-settings.api-auth.test.ts` (2 tests)

**Errors:**
- Expected 401, received 404
- Expected 200, received 401/500
- `Cannot read properties of undefined (reading 'allowed')`

**Action Items:**
- [ ] Fix authentication middleware order
- [ ] Ensure 401 is returned before 404 for unauthenticated requests
- [ ] Add proper permission checks in RBAC guards
- [ ] Fix TEAM_LEAD role permission validation
- [ ] Verify auth session is properly passed to route handlers

---

### 5. Tenant Security & Isolation Issues
**Priority:** P1 - High  
**Files Affected:**
- Tenant middleware
- Portal routes

**Failed Tests:**
- ✗ `tests/integration/tenant-mismatch.portal.security.test.ts` (3 tests)
- ✗ `tests/integration/tenant-mismatch.security.test.ts`
- ✗ `tests/integration/portal-bookings-cancel.test.ts`
- ✗ `tests/integration/org-settings.tenant-isolation.test.ts`

**Errors:**
- Portal returns empty array instead of filtered tenant items
- Expected 404 on tenant mismatch, got 400
- Tenant header not respected

**Action Items:**
- [ ] Fix portal service-requests GET to filter by session tenant
- [ ] Implement proper tenant mismatch detection (should return 404)
- [ ] Fix export route tenant filtering
- [ ] Ensure x-tenant-id header is respected in admin routes
- [ ] Add tenant validation in withTenantRLS helper

---

### 6. Booking Conflict Detection
**Priority:** P1 - High  
**Files Affected:**
- Booking creation logic
- Conflict detection service

**Failed Tests:**
- ✗ `tests/bookings.post-conflict-409.test.ts` (2 tests)

**Error:** Expected 409 conflict status, received 500

**Action Items:**
- [ ] Fix booking conflict detection to return proper 409 status
- [ ] Add proper error handling in booking service
- [ ] Ensure conflict checks happen before database operations
- [ ] Update both admin and portal booking routes

---

## 🟠 Medium Priority Issues (Feature Completeness)

### 7. Component Rendering Issues (SSR/DOM)
**Priority:** P2 - Medium  
**Files Affected:**
- React components with SSR

**Failed Tests:**
- ✗ `tests/integration/settings-provider.integration.test.tsx` (3 tests)
- ✗ `tests/org-settings-footer-and-tenant.test.tsx`
- ✗ `tests/admin-services.components.test.ts` (3 tests)
- ✗ `tests/hooks/useUnifiedData.test.tsx` (2 tests)
- ✗ `tests/unit/localStorage.test.ts` (2 tests)
- ✗ `tests/admin/integration/navigation-routing.test.tsx` (17 tests)
- ✗ `tests/ui/navigation.a11y.dom.test.tsx`

**Error:** `document is not defined` / `window is not defined` / Invalid element type

**Action Items:**
- [ ] Add proper JSDOM setup for component tests
- [ ] Mock window/document objects in test environment
- [ ] Fix component imports (ensure proper default/named exports)
- [ ] Add SSR-safe checks for browser APIs
- [ ] Consider using @testing-library/react with proper environment

---

### 8. Data Table & Pagination Issues
**Priority:** P2 - Medium  
**Files Affected:**
- Admin bookings API
- Data table components

**Failed Tests:**
- ✗ `tests/api/admin-bookings.contract.test.ts` (2 tests)
- ✗ `tests/admin-services.route.test.ts` - GET list returns undefined count
- ✗ `tests/e2e/admin-bookings.smoke.test.ts`

**Errors:**
- X-Total-Count header missing
- Sort order not working correctly
- Client email undefined

**Action Items:**
- [ ] Add X-Total-Count header to admin bookings GET endpoint
- [ ] Fix sortBy/sortOrder query parameter handling
- [ ] Ensure pagination metadata is included in responses
- [ ] Add proper field population (e.g., clientEmail)

---

### 9. Upload & File Scanning Issues
**Priority:** P2 - Medium  
**Files Affected:**
- Upload service
- Antivirus callback handler

**Failed Tests:**
- ✗ `tests/uploads.infected.lenient.test.ts`
- ✗ `tests/uploads.clean.test.ts`

**Errors:**
- Cannot read properties of undefined
- Expected spy to be called at least once

**Action Items:**
- [ ] Fix file upload response structure
- [ ] Ensure antivirus scanning is properly invoked
- [ ] Verify audit logging for uploads
- [ ] Test lenient vs strict AV policies

---

### 10. Auto-Assignment Logic
**Priority:** P2 - Medium  
**Files Affected:**
- Auto-assignment service

**Failed Tests:**
- ✗ `tests/auto-assignment.test.ts` (2 tests)

**Error:** Expected team member ID, received null

**Action Items:**
- [ ] Fix skill-based assignment algorithm
- [ ] Implement fallback to least-workload assignment
- [ ] Add proper team member availability checks
- [ ] Test edge cases (no available members, etc.)

---

## 🟢 Low Priority Issues (Non-Critical)

### 11. Timezone & DST Handling
**Priority:** P3 - Low  
**Files Affected:**
- Availability engine

**Failed Tests:**
- ✗ `tests/availability/timezone.integration.test.ts` (2 tests)

**Action Items:**
- [ ] Fix timezone offset calculations
- [ ] Handle DST transitions properly
- [ ] Ensure slot generation respects tenant timezone
- [ ] Test with multiple timezone scenarios

---

### 12. ETag/Caching Issues
**Priority:** P3 - Low  
**Files Affected:**
- Admin services API

**Failed Tests:**
- ✗ `tests/admin-services.etag.test.ts`

**Action Items:**
- [ ] Implement ETag header generation
- [ ] Add 304 Not Modified response support
- [ ] Test If-None-Match header handling

---

### 13. IP Allowlist Validation
**Priority:** P3 - Low  
**Files Affected:**
- IP allowlist matcher

**Failed Tests:**
- ✗ `tests/security/ip-allowlist.test.ts` (2 tests)

**Action Items:**
- [ ] Fix IPv4-mapped IPv6 matching
- [ ] Handle IPv6 compression patterns
- [ ] Test CIDR range matching

---

### 14. Reminder Scheduling
**Priority:** P3 - Low  
**Files Affected:**
- Cron reminders route

**Failed Tests:**
- ✗ `tests/cron-reminders.route.test.ts`

**Action Items:**
- [ ] Fix reminderSent flag update
- [ ] Verify reminder window calculation
- [ ] Test email sending integration

---

### 15. Step-Up Authentication
**Priority:** P3 - Low  
**Files Affected:**
- Step-up verification

**Failed Tests:**
- ✗ `tests/security/step-up.test.ts`

**Action Items:**
- [ ] Fix OTP requirement detection
- [ ] Verify tenant-level override logic
- [ ] Test with various security settings

---

### 16. Miscellaneous UI/Template Issues
**Priority:** P3 - Low  
**Failed Tests:**
- ✗ `tests/smoke/admin-analytics.template.test.ts`
- ✗ `tests/smoke/admin-overview.template.test.ts`
- ✗ `tests/smoke/admin-service-requests.template.test.ts`
- ✗ `tests/templates.route.test.ts`
- ✗ `tests/team-management.routes.test.ts` (3 tests)
- ✗ `tests/admin-services.clone.route.test.ts` (2 tests)
- ✗ `tests/unit/settings.registry.test.ts`
- ✗ `tests/api/perf-metrics.thresholds.test.ts`
- ✗ `tests/integration/db-raw.helper.test.ts` (2 tests)
- ✗ `tests/admin-services-settings.permissions.test.ts`
- ✗ `tests/integration/chat-offline.test.ts`
- ✗ `tests/dashboard/content/admin-posts.flows.dom.test.tsx` (3 tests)
- ✗ `tests/components/communication-settings.export-import.ui.test.tsx`
- ✗ `tests/components/analytics-settings.export-import.ui.test.tsx`
- ✗ `tests/dashboard/tables/dom/advanced-data-table.a11y-focus.dom.test.tsx`
- ✗ `tests/dashboard/nav/sidebar-ia.test.tsx`
- ✗ `tests/invoicing/automated-billing.dom.test.tsx`
- ✗ `tests/admin/hooks/useResponsive.test.tsx` (7 tests)

**Action Items:**
- [ ] Fix template reference assertions
- [ ] Update component import paths
- [ ] Fix PageHeader icon prop validation
- [ ] Address accessibility focus management
- [ ] Fix sidebar navigation rendering
- [ ] Update responsive hook window checks
- [ ] Fix export/import modal interactions

---

### 17. Sentry Integration
**Priority:** P3 - Low  
**Failed Tests:**
- ✗ `tests/integration/sentry-tenant-tags.test.ts` (2 tests)

**Error:** Failed to load sentry.server.config

**Action Items:**
- [ ] Create or fix sentry.server.config file
- [ ] Add proper Sentry initialization
- [ ] Test tenant tag injection

---

## 📋 Test Maintenance Tasks

### Skipped Tests to Review
- ℹ️ `tests/integration/booking-invoice.test.ts` - Skipped (ADMIN_AUTH_TOKEN not set)

**Action Items:**
- [ ] Set up proper test environment variables
- [ ] Enable and verify integration test

---

### Empty Test Suites to Implement
The following test files have 0 tests defined:
- `tests/services.service.test.ts`
- `tests/integration/portal-export.filters.test.ts`
- `tests/unit/portal-auth.test.ts`
- `tests/services.caching-events.test.ts`
- `tests/integration/prisma-mock.examples.test.ts`
- `tests/availability/timezone.integration.test.ts`
- `tests/integration/org-settings.persistence.test.ts`
- `tests/integration/availability.dst-end.e2e.test.ts`
- `tests/integration/availability.e2e.test.ts`
- `tests/integration/tenant-mismatch.email.test.ts`
- `tests/integration/tenant-mismatch.bookings.test.ts`
- `tests/offline-backoff.test.ts`
- `tests/booking-settings.panel.render.test.tsx`
- `tests/templates/analytics-page.render.test.tsx`
- `tests/templates/list-page.render.test.tsx`
- `tests/smoke/admin-posts.template.test.tsx`
- `tests/templates/standard-page.render.test.tsx`
- `tests/admin/layout/AdminDashboardLayout.test.tsx`
- `tests/admin/layout/AdminSidebar.test.tsx`
- `tests/home/services-section.loading.a11y.dom.test.tsx`
- `tests/components/settings-shell.test.tsx`
- `tests/providers/route-announcer.dom.test.tsx`
- `tests/components/service-requests.table.test.tsx`
- `tests/components/kpi-grid.smoke.test.tsx`
- `tests/components/services-list.smoke.test.tsx`
- `tests/components/communication-settings.page.test.tsx`
- `tests/components/org-general-tab.test.tsx`
- `tests/admin/providers/admin-providers.test.tsx`

**Action Items:**
- [ ] Review each empty test file
- [ ] Implement missing tests or remove placeholder files
- [ ] Prioritize based on feature importance

---

## 🎯 Recommended Fix Order

1. **Phase 1 - Critical Blockers (Week 1)**
   - Fix tenant context injection (#1)
   - Fix rate-limit mocks (#2)
   - Fix Prisma mocks (#3)

2. **Phase 2 - Auth & Security (Week 2)**
   - Fix authentication middleware (#4)
   - Fix tenant isolation (#5)
   - Fix booking conflicts (#6)

3. **Phase 3 - Component & UI (Week 3)**
   - Fix SSR/DOM rendering issues (#7)
   - Fix data table issues (#8)

4. **Phase 4 - Feature Completion (Week 4)**
   - Fix upload/AV issues (#9)
   - Fix auto-assignment (#10)
   - Address medium priority items (#11-15)

5. **Phase 5 - Polish & Maintenance (Week 5)**
   - Fix low priority issues (#16-17)
   - Implement empty test suites
   - Review and enable skipped tests

---

## 📊 Progress Tracking

- [ ] Critical Issues: 0/3 completed
- [ ] High Priority: 0/3 completed  
- [ ] Medium Priority: 0/6 completed
- [ ] Low Priority: 0/4 completed
- [ ] Test Maintenance: 0/2 completed

**Overall Progress: 0/73 failed tests fixed (0%)**

---

## 💡 General Recommendations

1. **Test Environment Setup**
   - Ensure consistent mock patterns across all tests
   - Set up proper test database with migrations
   - Configure environment variables for CI/CD

2. **Code Quality**
   - Add proper error handling in all API routes
   - Implement consistent response formats
   - Add input validation at route boundaries

3. **Documentation**
   - Document tenant context requirements
   - Add API contract documentation
   - Create testing best practices guide

4. **CI/CD**
   - Set up test failure notifications
   - Add test coverage reporting
   - Implement parallel test execution for faster feedback

---

*Last Updated: October 9, 2025*  
*Next Review: After Phase 1 Completion*