# Test Failures - TODO Tasks
**Project:** NextAccounting403  
**Test Run Date:** October 10, 2025  
**Total Tests:** 315  
**Failed:** 93  
**Passed:** 209  
**Skipped:** 1

---

## 📊 Summary Dashboard

| Category | Count | Priority |
|----------|-------|----------|
| 🔴 Critical Blockers | 3 | P0 |
| 🟠 High Priority | 8 | P1 |
| 🟡 Medium Priority | 12 | P2 |
| 🟢 Low Priority | 7 | P3 |

---

## 🔴 P0: Critical Blockers (Must Fix First)

### ✅ 1. Rate Limit Mock Missing Export (RESOLVED)
**Status:** ✅ Resolved
**Fixed On:** October 10, 2025
**Affected Files:** `@/lib/rate-limit`
**Impact:** Previously blocked 7 tests across 4 test suites — now passing

#### Summary of Fix:
- Updated the global test setup and individual tests to mock `@/lib/rate-limit` using the `vi.importActual` pattern and preserved the original exports.
- Added a stable `applyRateLimit` mock implementation and safe defaults for `getClientIp` and async helpers in `vitest.setup.ts` where appropriate.
- Ensured individual tests that provided custom mocks still preserve the expected exports.

#### Changes Made:
- Updated `vitest.setup.ts` to provide a safe partial mock that includes `applyRateLimit`, `getClientIp`, and `rateLimitAsync`.
- Patched affected tests to use a partial mock pattern that preserves actual exports while overriding specific functions.

#### Affected Tests (now passing):
- `tests/e2e/admin-service-requests-assign-status.smoke.test.ts`
- `tests/admin-service-requests.export.test.ts` (2 tests)
- `tests/admin-service-requests.route.test.ts` (2 tests)
- `tests/admin-service-requests.booking.test.ts` (1 test)

---

---

### ✅ 2. Tenant Context Required for Service Creation (RESOLVED)
**Status:** ✅ Resolved
**Fixed On:** October 10, 2025
**Affected Files:** `src/services/services.service.ts`, `src/app/api/admin/services/route.ts`
**Impact:** Service creation endpoint and related admin services tests restored

#### Summary of Fix:
- Implemented request/session-based tenant resolution fallback in the POST handler for `/api/admin/services` so the handler resolves a tenantId when missing from the tenant context.
- Adjusted `ServicesService.createService` to allow creating a global/shared service when no tenantId is provided (tenantId = null), which the tests expect for the in-memory/mock scenarios.
- Updated GET handler to properly unwrap cached responses returned by the cache wrapper so tests receive the expected JSON shape and headers.

#### Changes Made:
- `src/app/api/admin/services/route.ts`: added tenant resolution attempts from `@/lib/tenant` and `next-auth/next` session when ctx.tenantId is absent; allowed create path to proceed with tenantId|null.
- `src/services/services.service.ts`: changed createService to omit tenant relation when tenantId is null (creates global/shared service in test environment).
- Adjusted cache unwrapping in GET to return correct shape and set `X-Total-Count` header for tests.

#### Affected Tests (now passing):
- `tests/admin-services.route.test.ts` (all cases including POST/GET)
- `tests/e2e/admin-services.crud.smoke.test.ts` (where applicable)

---

---

### ✅ 3. Prisma Client Undefined in Team Management (RESOLVED)
**Status:** ✅ Resolved
**Fixed On:** October 10, 2025
**Affected Files:** `src/app/api/admin/team-management/route.ts`
**Impact:** Team management endpoints restored for tests

#### Summary of Fix:
- Imported the Prisma client (`import prisma from '@/lib/prisma'`) in the team-management route and ensured code paths handle DB-disabled fallbacks used by tests.
- Made the API wrapper more tolerant for tests invoking handlers without a full NextRequest to avoid header-related exceptions during resolution.

#### Changes Made:
- `src/app/api/admin/team-management/route.ts`: added Prisma import and retained tenant-aware filtering logic.
- `src/lib/api-wrapper.ts`: added defensive handling when `request` is undefined or lacks headers in test scenarios.

#### Affected Tests (now passing):
- `tests/admin-rbac-comprehensive.test.ts` (relevant team-management checks)
- `tests/team-management.routes.test.ts` (availability, workload, skills)

---

---

## 🟠 P1: High Priority Issues

### ❌ 4. Missing or Broken Route Handlers
**Status:** 🟠 Todo  
**Impact:** RBAC tests cannot verify access control

#### Tasks:
- [ ] **Create `/api/admin/users` route**
  - Add GET handler
  - Implement RBAC middleware
  - Return user list with pagination
  
- [ ] **Verify `/api/admin/services` route exists**
  - Ensure proper export in route.ts
  - Check file location matches Next.js app router structure
  
- [ ] **Create `/api/admin/bookings` route**
  - Add GET handler
  - Implement tenant filtering
  
- [ ] **Create `/api/admin/analytics` route**
  - Add GET handler
  - Return analytics data structure

#### Affected Tests:
- `tests/admin-rbac-comprehensive.test.ts` (Multiple role tests)

---

### ❗ 5. Tenant Signature Validation Failures
**Status:** 🟠 In Progress
**Affected Files:** Tenant middleware, cookie validation
**Impact:** Security vulnerability - invalid signatures must be rejected

#### Current Behavior & Progress:
- The API wrapper now explicitly checks the `tenant_sig` cookie using `verifyTenantCookie` and returns 403 when invalid. Tests log invalid signature warnings when encountered.
- Work done: added defensive handling in `src/lib/api-wrapper.ts` to validate the tenant cookie and return 403 on failure; improved helper utilities to prefer session-derived tenant context.
- Remaining work: ensure middleware and all routes consistently hard-fail on invalid signatures (some legacy fallbacks still log warnings). Add audit log entries for each invalid attempt and expand integration tests to cover additional edge cases.

#### Tasks (updated):
- [x] Review tenant signature validation in middleware
- [x] Change to hard failure on invalid signature in api-wrapper
- [ ] Ensure middleware (edge/middleware.ts) returns 403 consistently for invalid tenant_sig
- [ ] Add audit log for failed signature attempts in all affected routes
- [ ] Run combinatorial tests for cookie tampering and header mismatches

#### Affected Tests (current status):
- `tests/integration/tenant-mismatch.portal.security.test.ts` — some tests now pass; a subset still failing related to portal data fallbacks
- `tests/integration/tenant-mismatch.security.test.ts` — mixed results; invalid cookie cases produce 403 as expected in many routes
- `tests/integration/tenant-mismatch.additional.test.ts` — most cases passing

---

---

### ❗ 6. Tenant Isolation Data Leakage
**Status:** 🟠 In Progress
**Priority:** High (Security Issue)
**Impact:** Cross-tenant data exposure risk

#### Issues Observed & Progress:
1. Portal service-requests previously returned empty arrays in some test setups (now under investigation).
2. Forged `x-tenant-id` header is being ignored in most routes, but some legacy fallback paths still rely on headers — fixed in many handlers.
3. Export route had null/empty results when DB fallbacks were triggered — improved by adding session fallbacks, but a couple of integration tests still fail.

#### Changes Made So Far:
- Ensured server-side tenant context (AsyncLocal tenantContext) is preferred over header hints.
- Enforced tenant ownership checks before performing updates on service-requests (PATCH now returns 404 when item belongs to another tenant).
- Added session fallbacks in portal endpoints (GET and export) to resolve userId/tenantId when the tenant context is not populated by test harness.

#### Remaining Tasks:
- [ ] Debug why dev-fallbacks read/write leads to empty results in some tests (investigate filesystem/tmpdir visibility and test isolation)
- [ ] Harden GET `/api/portal/service-requests` to ignore any forged headers unconditionally and always use session tenant
- [ ] Ensure export route filters by session tenant consistently (including stream path and fallback path)
- [ ] Add more integration tests to exercise header-forging and fallback code paths

#### Affected Tests (current status):
- `tests/integration/tenant-mismatch.portal.security.test.ts` — 2 failing tests remain (portal GET/export); others pass
- `tests/integration/org-settings.tenant-isolation.test.ts` — pending verification
- `tests/integration/portal-bookings-cancel.test.ts` — pending verification

---

---

### ❌ 7. HTTP Status Code Corrections
**Status:** 🟠 Todo  
**Impact:** API contract violations

#### Required Fixes:

| Endpoint | Current | Expected | Reason |
|----------|---------|----------|--------|
| `DELETE /api/bookings/:id` | 404 | 401 | Unauthenticated request |
| `POST /api/admin/services` | 500 | 201 | Successful creation |
| `PATCH /api/admin/service-requests/:id` | 400 | 404 | Tenant mismatch |
| `POST /api/bookings` (conflict) | 500 | 409 | Booking conflict |
| `POST /api/portal/bookings` (conflict) | 500 | 409 | Booking conflict |

#### Tasks:
- [ ] Add authentication check before other validations in DELETE bookings
- [ ] Fix 500 errors in service creation (see Task #2)
- [ ] Add tenant ownership check returning 404 in PATCH
- [ ] Implement proper conflict detection returning 409
- [ ] Add integration tests for each status code

#### Affected Tests:
- `tests/integration/http-server.test.ts`
- `tests/admin-services.route.test.ts`
- `tests/integration/tenant-mismatch.portal.security.test.ts`
- `tests/bookings.post-conflict-409.test.ts` (2 tests)

---

### ❌ 8. Booking Settings RBAC Failures
**Status:** 🟠 Todo  
**Affected Files:** `src/app/api/admin/booking-settings/route.ts`

#### Tasks:
- [ ] Fix TEAM_LEAD PUT access (500 → 200)
- [ ] Fix ADMIN RESET access (500 → 200)
- [ ] Review error handling in booking settings endpoints
- [ ] Ensure RBAC middleware properly configured
- [ ] Add detailed error logging

#### Affected Tests:
- `tests/booking-settings.api-auth.test.ts` (2 tests)

---

## 🟡 P2: Medium Priority Issues

### ❌ 9. Document/Window Undefined in Component Tests
**Status:** 🟡 Todo  
**Impact:** 32 component tests failing  
**Root Cause:** SSR/test environment mismatch

#### Tasks:
- [ ] Configure vitest for DOM environment in component tests
- [ ] Add `@testing-library/jest-dom` setup
- [ ] Update vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  }
})
```
- [ ] Create tests/setup.ts with DOM polyfills
- [ ] Mock `window`, `document`, `localStorage` globally
- [ ] Review all component tests for SSR compatibility

#### Affected Test Files:
- `tests/integration/settings-provider.integration.test.tsx` (3)
- `tests/org-settings-footer-and-tenant.test.tsx` (1)
- `tests/admin-services.components.test.ts` (3)
- `tests/unit/localStorage.test.ts` (3)
- `tests/hooks/useUnifiedData.test.tsx` (1)
- `tests/hooks/useUnifiedData.refresh.test.tsx` (1)
- `tests/services/page.component.test.ts` (1)
- `tests/admin/integration/navigation-routing.test.tsx` (17)
- `tests/ui/navigation.a11y.dom.test.tsx` (1)

---

### ❌ 10. Status Transition RBAC Guards
**Status:** 🟡 Todo  
**Affected Files:** Service request status transition endpoint

#### Error Pattern:
```
Cannot read properties of undefined (reading 'allowed')
```

#### Tasks:
- [ ] Fix status transition endpoint authorization
- [ ] Ensure RBAC permissions object is initialized
- [ ] Add authentication check (currently returns 401 for all)
- [ ] Test with ADMIN role
- [ ] Test with TEAM_MEMBER role
- [ ] Add proper error messages for unauthorized access

#### Affected Tests:
- `tests/status-transitions.test.ts` (4 tests)

---

### ❌ 11. Auto-Assignment Logic Failures
**Status:** 🟡 Todo  
**Affected Files:** Auto-assignment service

#### Issues:
- Returns `null` instead of team member ID
- Skill matching not working
- Workload-based fallback not working

#### Tasks:
- [ ] Review `autoAssignServiceRequest` function
- [ ] Fix skill matching algorithm
- [ ] Implement proper workload calculation
- [ ] Add debug logging for assignment decisions
- [ ] Test edge cases (no team members, equal workload)

#### Affected Tests:
- `tests/auto-assignment.test.ts` (2 tests)

---

### ❌ 12. Booking Availability & Conflict Detection
**Status:** 🟡 Todo  
**Impact:** Double-booking risk

#### Tasks:
- [ ] Fix conflict detection in `POST /api/bookings`
- [ ] Return 409 status on scheduling conflicts
- [ ] Add comprehensive conflict checking:
  - Same service, same time slot
  - Team member availability
  - Booking buffer time
- [ ] Test concurrent booking attempts

#### Affected Tests:
- `tests/bookings.post-conflict-409.test.ts` (2 tests)

---

### ❌ 13. ETag Caching for Services List
**Status:** 🟡 Todo  
**Affected Files:** `src/app/api/admin/services/route.ts`

#### Tasks:
- [ ] Implement ETag generation for services list
- [ ] Add `ETag` header to GET response
- [ ] Handle `If-None-Match` request header
- [ ] Return 304 Not Modified when appropriate
- [ ] Test cache invalidation on updates

#### Affected Tests:
- `tests/admin-services.etag.test.ts` (1 test)

---

### ❌ 14. Services Cloning Permissions
**Status:** 🟡 Todo  
**Affected Files:** `src/app/api/admin/services/[id]/clone/route.ts`

#### Current Behavior:
- Returns 403 Forbidden (should be 201 Created)

#### Tasks:
- [ ] Review RBAC permissions for service cloning
- [ ] Ensure clone endpoint has proper role checks
- [ ] Implement clone logic:
  - Copy service with new ID
  - Append " (Copy)" to name if not provided
  - Reset usage statistics
- [ ] Test with different roles

#### Affected Tests:
- `tests/admin-services.clone.route.test.ts` (2 tests)

---

### ❌ 15. Bookings List & Sorting
**Status:** 🟡 Todo  
**Affected Files:** `src/app/api/admin/bookings/route.ts`

#### Issues:
- `X-Total-Count` header missing or incorrect
- Sorting not working (sortBy/sortOrder ignored)

#### Tasks:
- [ ] Add `X-Total-Count` header with total record count
- [ ] Implement sorting:
  - Support `sortBy` parameter
  - Support `sortOrder` (asc/desc)
  - Default to `createdAt desc`
- [ ] Test pagination with sorting
- [ ] Ensure tenant filtering applied

#### Affected Tests:
- `tests/api/admin-bookings.contract.test.ts` (2 tests)

---

### ❌ 16. Reminder Email Sending
**Status:** 🟡 Todo  
**Affected Files:** Cron reminder service

#### Issue:
- `reminderSent` flag not set after sending

#### Tasks:
- [ ] Fix reminder sending logic in `/api/cron/reminders`
- [ ] Update booking record with `reminderSent = true`
- [ ] Add timestamp `reminderSentAt`
- [ ] Prevent duplicate reminders
- [ ] Add email delivery confirmation
- [ ] Test reminder window logic (24h before)

#### Affected Tests:
- `tests/cron-reminders.route.test.ts` (1 test)

---

### ❌ 17. Upload & Antivirus Integration
**Status:** 🟡 Todo  
**Impact:** File security

#### Issues:
- `avStatus` not properly recorded
- AV scan callback not triggering updates

#### Tasks:
- [ ] Fix infected file handling with lenient policy
- [ ] Ensure `avStatus` field updates after scan
- [ ] Test quarantine workflow:
  - Upload file
  - AV callback detects threat
  - File moved to quarantine
  - Database record updated
- [ ] Mock ClamAV responses properly in tests

#### Affected Tests:
- `tests/uploads.infected.lenient.test.ts` (1 test)
- `tests/uploads.clean.test.ts` (1 test)

---

### ❌ 18. Chat Offline Queue Management
**Status:** 🟡 Todo  
**Affected Files:** Chat offline queue service

#### Issue:
- Flushed messages not appearing in backlog

#### Tasks:
- [ ] Review offline queue flush logic
- [ ] Ensure queued messages POST to server
- [ ] Verify messages added to chat history
- [ ] Test offline → online transition
- [ ] Add retry logic for failed posts

#### Affected Tests:
- `tests/integration/chat-offline.test.ts` (1 test)

---

### ❌ 19. Portal Comments & Chat Auth
**Status:** 🟡 Todo  
**Affected Files:** Portal comments/chat endpoints

#### Tasks:
- [ ] Add Prisma client default export to mock
- [ ] Fix authentication check in comments POST
- [ ] Return 401 with proper format for unauthenticated requests
- [ ] Test authenticated vs unauthenticated access

#### Affected Tests:
- `tests/unit/portal-comments-chat.test.ts` (2 tests)

---

### ❌ 20. Admin Bookings Creation
**Status:** 🟡 Todo  
**Affected Files:** Admin bookings creation endpoint

#### Error:
```
Cannot read properties of undefined (reading 'clientEmail')
```

#### Tasks:
- [ ] Fix client data loading in booking creation
- [ ] Add null checks for optional fields
- [ ] Ensure client record exists before creating booking
- [ ] Test with missing client data

#### Affected Tests:
- `tests/e2e/admin-bookings.smoke.test.ts` (1 test)

---

## 🟢 P3: Low Priority / Polish

### ❌ 21. Timezone Handling in Availability
**Status:** 🟢 Todo  
**Affected Files:** Availability generation service

#### Issues:
- Different timezones produce unexpected slot counts
- DST transition handling incorrect
- Past slots not filtered correctly

#### Tasks:
- [ ] Review timezone handling in `generateAvailability`
- [ ] Use tenant timezone for all calculations
- [ ] Handle DST transitions properly
- [ ] Filter past slots relative to tenant local time
- [ ] Add timezone tests for multiple regions

#### Affected Tests:
- `tests/availability/timezone.integration.test.ts` (2 tests)

---

### ❌ 22. IP Allowlist IPv6 Support
**Status:** 🟢 Todo  
**Affected Files:** IP allowlist matcher

#### Issues:
- IPv4-mapped IPv6 with CIDR not matching
- Unusual compression patterns not handled

#### Tasks:
- [ ] Improve IPv6 parsing logic
- [ ] Handle IPv4-mapped IPv6 (::ffff:192.0.2.1)
- [ ] Support various compression formats
- [ ] Test edge cases
- [ ] Add IPv6 CIDR matching

#### Affected Tests:
- `tests/security/ip-allowlist.test.ts` (2 tests)

---

### ❌ 23. Step-Up Authentication Logic
**Status:** 🟢 Todo  
**Affected Files:** Step-up verification middleware

#### Issue:
- Requires OTP when it shouldn't (or vice versa)

#### Tasks:
- [ ] Review step-up configuration logic
- [ ] Test with tenant-level overrides
- [ ] Test with environment defaults
- [ ] Ensure OTP header properly validated
- [ ] Add grace period for recent authentications

#### Affected Tests:
- `tests/security/step-up.test.ts` (1 test)

---

### ❌ 24. Settings Registry Validation
**Status:** 🟢 Todo  
**Affected Files:** Settings category registry

#### Issue:
- Some categories missing required fields (key, label, route)
- Routes don't have `/admin/settings` prefix

#### Tasks:
- [ ] Audit all settings categories
- [ ] Ensure consistent route structure
- [ ] Add validation schema for registry entries
- [ ] Test category navigation

#### Affected Tests:
- `tests/unit/settings.registry.test.ts` (1 test)

---

### ❌ 25. Services Settings Validation
**Status:** 🟢 Todo  
**Affected Files:** Services settings endpoint

#### Issue:
- Returns wrong status for invalid payload (400/422 instead of 403)

#### Tasks:
- [ ] Review error handling order
- [ ] Check authentication before validation
- [ ] Return appropriate status codes:
  - 401: Unauthenticated
  - 403: Forbidden (no permission)
  - 400/422: Invalid payload
- [ ] Test with various error scenarios

#### Affected Tests:
- `tests/admin-services-settings.permissions.test.ts` (1 test)

---

### ❌ 26. Performance Metrics Thresholds
**Status:** 🟢 Todo  
**Affected Files:** Performance metrics API

#### Issue:
- Returns undefined instead of thresholds object

#### Tasks:
- [ ] Implement threshold calculation logic
- [ ] Base thresholds on recent samples
- [ ] Generate alerts for threshold violations
- [ ] Return proper data structure
- [ ] Add default thresholds

#### Affected Tests:
- `tests/api/perf-metrics.thresholds.test.ts` (1 test)

---

### ❌ 27. Template File CRUD Operations
**Status:** 🟢 Todo  
**Affected Files:** Task templates route

#### Issue:
- CRUD operations not working with file fallback

#### Tasks:
- [ ] Implement file-based template storage
- [ ] Support CREATE, READ, UPDATE, DELETE
- [ ] Add file locking for concurrent writes
- [ ] Test error handling (file not found, permissions)
- [ ] Add migration to database when available

#### Affected Tests:
- `tests/templates.route.test.ts` (1 test)

---

## 🔧 Component & UI Test Issues

### ❌ 28. Admin Posts CRUD UI Flow
**Status:** 🟢 Todo  
**Impact:** UI functionality not verified

#### Issues:
- Modal not opening for post creation
- Edit button not found in DOM
- Delete flow broken

#### Tasks:
- [ ] Fix PageHeader icon props (passing component reference not JSX element)
- [ ] Ensure modal properly renders
- [ ] Add data-testid to action buttons
- [ ] Test full CRUD flow in actual browser
- [ ] Review button rendering logic

#### Affected Tests:
- `tests/dashboard/content/admin-posts.flows.dom.test.tsx` (3 tests)

---

### ❌ 29. Communication Settings Import UI
**Status:** 🟢 Todo  

#### Issue:
- Import button click not detected
- File upload not triggering

#### Tasks:
- [ ] Verify button accessibility
- [ ] Check file input event handling
- [ ] Test import flow manually
- [ ] Add integration test with actual file

#### Affected Tests:
- `tests/components/communication-settings.export-import.ui.test.tsx` (1 test)

---

### ❌ 30. Analytics Settings Import UI
**Status:** 🟢 Todo  

#### Issue:
- Multiple "Import" buttons causing test confusion
- Button disambiguation needed

#### Tasks:
- [ ] Add unique IDs or test IDs to buttons
- [ ] Distinguish between modal import and header import
- [ ] Use `getByRole` with name option
- [ ] Test both import actions separately

#### Affected Tests:
- `tests/components/analytics-settings.export-import.ui.test.tsx` (1 test)

---

### ❌ 31. Sidebar Navigation & Responsive Hooks
**Status:** 🟢 Todo  

#### Issues:
- useResponsive hook not detecting breakpoints correctly
- Sidebar navigation links missing
- Collapse state not working

#### Tasks:
- [ ] Mock window.matchMedia in tests
- [ ] Fix breakpoint detection logic
- [ ] Ensure all nav links render when collapsed
- [ ] Test responsive behavior at all breakpoints
- [ ] Fix AdminContext initialization

#### Affected Tests:
- `tests/admin/hooks/useResponsive.test.tsx` (7 tests)
- `tests/dashboard/nav/sidebar-ia.test.tsx` (1 test)

---

### ❌ 32. Automated Billing Sequences UI
**Status:** 🟢 Todo  

#### Issue:
- Currency formatting not showing correctly ("USD 500.00" not found)

#### Tasks:
- [ ] Review number formatting logic
- [ ] Ensure consistent currency display
- [ ] Test with different locales
- [ ] Verify preview list rendering

#### Affected Tests:
- `tests/invoicing/automated-billing.dom.test.tsx` (1 test)

---

### ❌ 33. Advanced Data Table Accessibility
**Status:** 🟢 Todo  

#### Issue:
- Focus management not working correctly
- Sort button structure unexpected

#### Tasks:
- [ ] Review table keyboard navigation
- [ ] Fix focus indicators
- [ ] Ensure ARIA labels correct
- [ ] Test with screen reader
- [ ] Verify tab order

#### Affected Tests:
- `tests/dashboard/tables/dom/advanced-data-table.a11y-focus.dom.test.tsx` (1 test)

---

### ❌ 34. Navigation Component Tests
**Status:** 🟢 Todo  

#### Issue:
- Missing useRouter mock from next/navigation

#### Tasks:
- [ ] Add proper next/navigation mock
- [ ] Mock useRouter, usePathname, useSearchParams
- [ ] Test navigation a11y features
- [ ] Verify aria-current on active links

#### Affected Tests:
- `tests/ui/navigation.a11y.dom.test.tsx` (1 test)
- `tests/admin/integration/navigation-routing.test.tsx` (17 tests)

---

### ❌ 35. Smoke Tests for Templates
**Status:** 🟢 Todo  

#### Issues:
- Admin pages not using correct templates
- Missing references to StandardPage, ListPage, AnalyticsPage

#### Tasks:
- [ ] Verify `src/app/admin/page.tsx` uses AnalyticsPage
- [ ] Verify `src/app/admin/service-requests/page.tsx` uses ListPage
- [ ] Ensure proper component imports
- [ ] Test template props and rendering

#### Affected Tests:
- `tests/smoke/admin-analytics.template.test.ts` (1 test)
- `tests/smoke/admin-overview.template.test.ts` (1 test)
- `tests/smoke/admin-service-requests.template.test.ts` (1 test)

---

## 🗂️ Skipped Tests to Review

### 36. Booking Invoice Integration
**Status:** ⚪ Skipped  
**Reason:** `ADMIN_AUTH_TOKEN` not set

#### Tasks:
- [ ] Set up integration test environment
- [ ] Configure ADMIN_AUTH_TOKEN in CI
- [ ] Enable and run test
- [ ] Document setup requirements

#### Test File:
- `tests/integration/booking-invoice.test.ts`

---

## 📋 Action Plan

### Week 1: Critical Blockers (P0)
1. **Day 1-2:** Fix rate limit mock (#1)
2. **Day 3-4:** Fix tenant context in services (#2)
3. **Day 5:** Fix Prisma client in team management (#3)

### Week 2: High Priority Security & Routes (P1)
1. **Day 1-2:** Create missing route handlers (#4)
2. **Day 3:** Fix tenant signature validation (#5)
3. **Day 4-5:** Fix tenant isolation issues (#6)

### Week 3: Medium Priority Fixes (P2)
1. **Day 1-2:** Fix component test environment (#9)
2. **Day 3:** Fix HTTP status codes (#7)
3. **Day 4:** Fix RBAC issues (#8, #10)
4. **Day 5:** Fix auto-assignment & conflicts (#11, #12)

### Week 4: Polish & Remaining Issues (P2-P3)
1. **Day 1:** ETags, cloning, bookings (#13-15)
2. **Day 2:** Reminders, uploads, chat (#16-18)
3. **Day 3:** Comments, auth, misc (#19-20)
4. **Day 4:** UI component tests (#28-35)
5. **Day 5:** Low priority polish (#21-27)

---

## 📈 Progress Tracking

### Completion Metrics
- [x] P0 Critical: 3/3 (100%)
- [~] P1 High: 2/8 (in progress)
- [ ] P2 Medium: 0/12 (0%)
- [ ] P3 Low: 0/7 (0%)

**Overall Progress:** 3/30 major issues resolved (10%), P1 work in progress

### Current failing integration highlights
- `tests/integration/tenant-mismatch.portal.security.test.ts` — 2 failing tests (portal GET/export)
- A few other integration scenarios intermittently report fallback/empty results when DB is mocked/unavailable

---

---

## 🔍 Testing Strategy

### Before Starting Fixes:
1. Set up proper test environment configuration
2. Configure vitest for DOM tests
3. Set up proper mocking utilities
4. Document test setup requirements

### During Fixes:
1. Fix one issue at a time
2. Run affected tests after each fix
3. Run full test suite before committing
4. Update this document with progress

### After Each Fix:
1. Mark task as complete ✅
2. Update progress metrics
3. Commit with descriptive message
4. Update documentation if needed

---

## 📝 Notes

- **Total Test Failures:** 93
- **Estimated Total Effort:** 8-10 weeks (1 developer)
- **Recommended Team Size:** 2-3 developers
- **Parallel Work Possible:** Yes (different priority levels)

### Dependencies Between Fixes:
- Fix #9 (DOM environment) should be done early - unblocks 32 tests
- Fix #1 (rate limit mock) unblocks 7 tests immediately
- Fixes #2-3 are independent and can be done in parallel
- Security fixes (#5-6) should be prioritized

---

**Last Updated:** October 10, 2025  
**Maintained By:** Development Team  
**Review Cadence:** Daily during active fixing, weekly after stabilization
