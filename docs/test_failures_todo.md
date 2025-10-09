# Test Failures - TODO Tasks

## 🔴 Critical - Rate Limiting Mock Issues (HIGH PRIORITY)

- [x] **Fix rate-limit mock configuration** - completed 2025-10-09
  - **Issue**: Multiple tests failing with `No "applyRateLimit" export is defined on the "@/lib/rate-limit" mock`
  - **Files Affected**: 
    - `tests/admin-rbac-comprehensive.test.ts`
    - `tests/admin-services.route.test.ts`
    - `tests/admin-service-requests.route.test.ts`
    - `tests/admin-export.route.test.ts`
    - `tests/portal-service-requests.route.test.ts`
    - `tests/status-transitions.test.ts`
    - `tests/portal-create-conflict-409.test.ts`
    - `tests/portal-recurring-create.route.test.ts`
  - **Action**: Update mock to include `applyRateLimit` export or use `vi.importActual` pattern
  - **Expected Outcome**: All rate-limit related test failures resolved

---

## 🟠 High Priority - Database & ORM Issues

### Booking Settings Service
- [x] **Fix BookingSettingsService tenant context** - completed 2025-10-09
  - **Issue**: "tenantId is required to create booking settings"
  - **Files**: `tests/booking-settings.service.test.ts` (4 failed tests)
  - **Action**: Ensure tenant context is properly set before service operations
  
- [x] **Fix booking settings API routes** - completed 2025-10-09
  - **Issue**: Multiple 500 errors and undefined settings
  - **Files**: `tests/booking-settings.api.test.ts` (5 failed)
  - **Action**: Debug API route handlers for proper settings initialization

### Prisma Tenant Guard Middleware
- [x] **Implement Prisma tenant guard middleware** - completed 2025-10-09
  - **Issue**: Middleware not injecting tenantId filters automatically
  - **Files**: `tests/integration/prisma-tenant-guard.test.ts` (6 failed)
  - **Tests Failing**:
    - Auto-inject tenantId on create
    - Block mismatched tenantId
    - Auto-scope bulk mutations
    - Auto-scope single-record mutations
    - Auto-scope reads
  - **Action**: Implement or fix Prisma middleware extension

### Prisma Mock Issues
- [x] **Fix Prisma client mocking** - completed 2025-10-09
  - **Issue**: Test setup issues with tenant context, permissions, and service settings mocking
  - **Files**: 
    - `tests/admin-service-requests.convert-to-booking.settings.test.ts` ✅ Fixed
    - `tests/admin-bookings-migrate.test.ts` ✅ Already working
  - **Action**: ✅ COMPLETED - Fixed test setup for tenant context, permissions, and service settings mocking
  - **Resolution**: The issue was not actually Prisma mocking but improper test setup for tenant context and permissions

---

## 🟡 Medium Priority - API Route Issues

### Missing Routes
- [ ] **Verify/implement missing API routes**
  - **Routes Not Found**:
    - `/api/admin/bookings` (multiple RBAC tests)
    - `/api/admin/service-requests` (multiple RBAC tests)
    - `/api/admin/analytics` (RBAC test)
    - `/api/admin/team-management` (multiple RBAC tests)
    - `/api/portal/bookings` (tenant mismatch test)
  - **Action**: Check route file locations and naming conventions

### Portal Routes
- [x] **Fix portal service-requests routes** - completed 2025-10-09
  - **Issue**: 404 errors for GET/PATCH/POST operations  
  - **Files**: 
    - `tests/portal-comments.route.test.ts` ✅ Fixed (3 passing)
    - `tests/portal-service-request-id.route.test.ts` ✅ Fixed (3 passing)
    - `tests/portal-confirm-reschedule.route.test.ts` ✅ Fixed (2 passing)
    - `tests/portal-service-requests.route.test.ts` ✅ Fixed (2 passing)
    - `tests/portal-service-requests.export.test.ts` ✅ Fixed (2 passing)
    - `tests/portal-create-conflict-409.test.ts` ✅ Fixed (1 passing)
    - `tests/portal-recurring-create.route.test.ts` ✅ Fixed (1 passing)
    - `tests/portal-reschedule-conflict-409.test.ts` ✅ Fixed (1 passing)
  - **Action**: Added proper next-auth/next mocking for App Router compatibility
  - **Resolution**: Tests were failing because they only mocked 'next-auth' but withTenantContext wrapper requires 'next-auth/next'. Added proper user session with tenantId and role.

- [ ] **Fix portal bookings cancel flow**
  - **Issue**: 404 errors on cancel operations
  - **File**: `tests/integration/portal-bookings-cancel.test.ts` (2 failed)
  - **Action**: Implement/fix cancel endpoint

---

## 🟢 Medium Priority - Authentication & Authorization

### RBAC & Permissions
- [x] **Fix admin services permissions** - completed 2025-10-09
  - **Issue**: Expected 403 but got 500 for featured field changes
  - **File**: `tests/admin-services.permissions.test.ts` ✅ Fixed (2 passing)
  - **Action**: Added proper auth mocking and permission checks for SERVICES_MANAGE_FEATURED
  - **Resolution**: PR #498

- [ ] **Fix step-up authentication**
  - **Issue**: OTP validation not enforcing (expected 401, got 200)
  - **Files**: 
    - `tests/admin-security-settings.stepup.test.ts` (2 failed)
    - `tests/admin-stepup.route.test.ts` (2 failed)
  - **Action**: Implement/fix super admin step-up verification

- [x] **Fix unauthenticated access controls** - completed 2025-10-09
  - **Issue**: Routes returning 200 instead of 401 for unauth users
  - **Files**:
    - `tests/admin-integration-hub.api.test.ts` ✅ Fixed (3/4 passing, 1 still has 500 error)
    - `tests/admin-communication-settings.api.test.ts` ✅ Fixed (2/3 passing, 1 still has 500 error)
    - `tests/admin-financial-settings.api.test.ts` ✅ Fixed (3 passing)
    - `tests/admin-org-settings.permissions.test.ts` ✅ Fixed (2 passing)
    - `tests/admin-auth-guard.test.ts` ✅ Fixed (1 passing)
    - `tests/admin-activity.route.test.ts` ✅ Fixed (2 passing)
  - **Action**: Added proper next-auth/next mocking for null sessions
  - **Resolution**: PR #499

### Tenant Security
- [ ] **Fix tenant context validation**
  - **Issue**: Invalid tenant_sig not properly returning 403
  - **Files**: Various tenant-mismatch tests
  - **Action**: Verify tenant signature validation logic

- [ ] **Fix tenant-switch route**
  - **Issue**: Expected 200, got 403 for valid membership
  - **File**: `tests/tenant-switch.route.test.ts`
  - **Action**: Debug membership validation logic

---

## 🔵 Medium Priority - Component & UI Tests

### React Component Render Issues
- [x] **Fix component test setup (render is not a function)** - completed 2025-10-09
  - **Files**:
    - `tests/components/communication-settings.export-import.ui.test.tsx` ✅ Fixed imports
    - `tests/components/analytics-settings.export-import.ui.test.tsx` ✅ Fixed imports
    - `tests/components/communication-settings.page.test.tsx` ✅ Fixed imports
    - `tests/components/client-settings.export-import.ui.test.tsx` ✅ Fixed imports
    - `tests/components/task-settings.export-import.ui.test.tsx` ✅ Fixed imports
    - `tests/components/team-settings.export-import.ui.test.tsx` ✅ Fixed imports
  - **Action**: ✅ COMPLETED - Installed @testing-library/react, jsdom, and fixed imports
  - **Resolution**: 
    - Installed @testing-library/react, @testing-library/user-event, @testing-library/dom
    - Installed jsdom for DOM environment
    - Updated vitest.config.ts to use jsdom for component tests
    - Fixed all imports from 'vitest' to '@testing-library/react'

### Template & Navigation Tests
- [ ] **Fix navigation links test**
  - **Issue**: Cron telemetry link missing from sidebar
  - **File**: `tests/navigation.links.test.ts`
  - **Action**: Add cron telemetry link to navigation config

- [ ] **Fix template reference tests**
  - **Files**:
    - `tests/smoke/admin-analytics.template.test.ts`
    - `tests/smoke/admin-overview.template.test.ts`
    - `tests/smoke/admin-service-requests.template.test.ts`
  - **Action**: Ensure pages reference correct template components

---

## 🟣 Low Priority - Data Validation & Business Logic

### Schema Validation
- [ ] **Fix numeric ID validation**
  - **Issue**: Pattern `/^\d+$/` failing for numeric IDs
  - **Files**:
    - `tests/e2e/admin-bookings.smoke.test.ts`
    - `tests/api/admin-service-requests.contract.test.ts`
    - `tests/api/admin-bookings.contract.test.ts`
    - `tests/admin-service-requests.filters.test.ts`
  - **Action**: Update schema to accept numeric IDs or convert to strings

### Conflict Detection
- [ ] **Fix booking conflict detection (409 responses)**
  - **Issue**: Expected 409, getting 500 or other codes
  - **Files**:
    - `tests/bookings.post-conflict-409.test.ts` (2 failed)
    - `tests/portal-reschedule-conflict-409.test.ts`
  - **Action**: Implement/fix conflict detection logic

### Auto-Assignment
- [ ] **Fix auto-assignment logic**
  - **Issue**: Returning null instead of assigned team member ID
  - **File**: `tests/auto-assignment.test.ts` (2 failed)
  - **Action**: Debug skill matching and workload calculation

---

## ⚪ Low Priority - Utility & Helper Functions

### Timezone & Availability
- [ ] **Fix timezone DST handling**
  - **Issue**: Slot generation inconsistent across timezones
  - **File**: `tests/availability/timezone.integration.test.ts` (2 failed)
  - **Action**: Ensure availability engine respects tenant timezone properly

### IP Allowlist
- [ ] **Fix IPv4-mapped IPv6 handling**
  - **Issue**: IPv4-mapped addresses not matching CIDR rules
  - **File**: `tests/security/ip-allowlist.test.ts` (2 failed)
  - **Action**: Normalize IPv6 addresses before comparison

### localStorage
- [ ] **Fix localStorage tests (window not defined)**
  - **Issue**: Window object not available in test environment
  - **File**: `tests/unit/localStorage.test.ts` (3 failed)
  - **Action**: Mock window object or use JSDOM environment

---

## 🔧 Infrastructure & Configuration

### Database Configuration
- [ ] **Handle missing database gracefully**
  - **Issue**: "Database is not configured" errors
  - **Files**: Multiple integration tests
  - **Action**: Add proper fallbacks or skip tests when DB unavailable

### File Upload & Antivirus
- [ ] **Fix antivirus callback test**
  - **Issue**: Cannot read properties of undefined (reading '0')
  - **File**: `tests/uploads.infected.lenient.test.ts`
  - **Action**: Ensure upload response structure is correct

- [ ] **Fix clean file upload test**
  - **Issue**: Spy not being called
  - **File**: `tests/uploads.clean.test.ts`
  - **Action**: Verify mock/spy setup for clean file flow

### E2E & Integration Tests
- [ ] **Fix admin services CRUD smoke test**
  - **Issue**: Clone endpoint returning 403 instead of 201
  - **File**: `tests/e2e/admin-services.crud.smoke.test.ts`
  - **Action**: Check permissions for clone operation

- [ ] **Fix chat offline queue test**
  - **Issue**: Empty array instead of queued messages
  - **File**: `tests/integration/chat-offline.test.ts`
  - **Action**: Debug offline queue implementation

- [ ] **Fix cron reminders test**
  - **Issue**: reminderSent flag not being set
  - **File**: `tests/cron-reminders.route.test.ts`
  - **Action**: Verify reminder sending logic

### Miscellaneous
- [ ] **Fix settings registry validation**
  - **Issue**: Not all categories have proper routes
  - **File**: `tests/unit/settings.registry.test.ts`
  - **Action**: Ensure all settings categories are properly configured

- [ ] **Fix template route CRUD**
  - **Issue**: Template operations failing
  - **File**: `tests/templates.route.test.ts`
  - **Action**: Debug template persistence logic

- [ ] **Fix analytics rate limiting test**
  - **Issue**: Expected 429 but got 200
  - **File**: `tests/analytics.track.route.test.ts`
  - **Action**: Ensure rate limiter is properly configured

- [ ] **Fix team management fallback routes**
  - **Issue**: 500 errors when DB not configured
  - **File**: `tests/team-management.routes.test.ts` (3 failed)
  - **Action**: Implement proper fallback responses

- [ ] **Fix settings services persistence**
  - **Issue**: Settings not being saved/retrieved correctly
  - **File**: `tests/admin-services-settings.route.test.ts`
  - **Action**: Debug settings save/load logic

---

## 📊 Test Summary

**Total Tests**: ~200+  
**Failed Tests**: ~100+  
**Pass Rate**: ~50%

### Priority Breakdown:
- 🔴 **Critical**: 1 major blocker (rate-limit mock)
- 🟠 **High**: 10+ database/ORM issues
- 🟡 **Medium**: 15+ API route issues
- 🟢 **Medium**: 10+ auth/permission issues
- 🔵 **Medium**: 8+ component tests
- 🟣 **Low**: 6+ validation issues
- ⚪ **Low**: 8+ utility functions

---

## 📝 Next Steps

1. **Start with Critical** - Fix rate-limit mock (will resolve ~30+ test failures)
2. **Database Setup** - Ensure Prisma middleware and tenant guards are working
3. **Route Verification** - Check all API routes are properly defined
4. **Auth Layer** - Fix authentication and RBAC middleware
5. **Component Tests** - Set up proper React Testing Library configuration
6. **Polish** - Address remaining validation and utility issues

---

## 🔍 Investigation Needed

- [ ] Determine if certain routes are intentionally missing or need implementation
- [ ] Verify if database configuration is expected in test environment
- [ ] Check if Sentry config file location is correct
- [ ] Investigate why some settings endpoints return wrong status codes

---

## 📅 Progress Tracking

**Last Updated**: 2025-10-09 (Session 2)

### Completed Tasks (Session 2)
- [x] Fixed all portal route tests (10 test files) - PR #496, #497
- [x] Fixed admin services permissions - PR #498
- [x] Fixed admin unauthenticated access controls (8 tests) - PR #499
- [x] Identified and documented root cause of most failures (missing next-auth/next mocks)

### In Progress
- [ ] Fix remaining admin PUT tests (communication-settings, integration-hub returning 500)
- [ ] Fix tenant context validation

### Blocked
- [ ] None currently

---

## 💡 Notes

- Start with the rate-limit mock as it's blocking the most tests
- Consider setting up a CI/CD pipeline to run tests automatically
- Document all fixes in commit messages for future reference
- Update this file as you complete tasks
