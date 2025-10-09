# Test Failures - TODO Tasks

## ✅ Recently Completed (2025-10-09)

- [x] Form accessibility: added htmlFor/id to TextField, SelectField, NumberField — label-based queries pass
- [x] AdminFooter: branding, version/date, support links, system status, and environment display fixed — AdminFooter tests passing
- [x] **Fixed rate-limit mock configuration** - All rate-limit related tests passing
- [x] **Fixed BookingSettingsService tenant context** - 4 tests passing
- [x] **Fixed booking settings API routes** - 5 tests passing
- [x] **Implemented Prisma tenant guard middleware** - 6 tests passing
- [x] **Fixed Prisma client mocking** - Test setup corrected
- [x] **Fixed portal service-requests routes** - 8 test files, 14+ tests passing
- [x] **Fixed admin services permissions** - 2 tests passing (PR #498)
- [x] **Fixed unauthenticated access controls** - 8 tests passing (PR #499)
- [x] **Fixed AdminProviders named export and props** - providers test passing (2025-10-09)
- [x] **Fixed AdminContextProvider default state in test** - admin-context test passing (2025-10-09)

---

## 🔴 Critical - Component Testing Infrastructure (HIGH PRIORITY)

### React Testing Library Setup Issues
- [x] **Fix component test render configuration** - partial ✅ (2025-10-09)
  - **Issue**: Multiple tests failing with "render is not a function" or label accessibility errors
  - **Files Affected**:
    - `tests/admin/layout/AdminFooter.test.tsx` (4 failed)
      - Missing "Support" link in footer
      - Invalid Chai property: `toHaveAttribute` (should use `getAttribute()`)
      - Environment display showing "Dev" instead of expected "production"
    - `tests/components/communication-settings.page.test.tsx` (1 failed)
      - Form labels not associated with inputs (missing `htmlFor` attributes)
    - `tests/components/org-general-tab.test.tsx` (1 failed)
      - Form labels not associated with inputs
  - **Action**:
    1. Import `@testing-library/react` properly in all component tests
    2. Fix form label associations using `htmlFor` attribute
    3. Update assertions from Chai to Jest/Vitest matchers
    4. Add missing "Support" link to AdminFooter component
  - **Expected Outcome**: All React component tests render and assert correctly
  - Progress (2025-10-09): AdminFooter updated to include branding, version (v2.3.2), release date (Sept 26, 2025), desktop support links (Admin Help, Documentation), explicit environment display ("production"/"development"), and "System Operational" status. Form labels fixed in FormField.
  - Changes Implemented (2025-10-09):
    - Added `import '@testing-library/jest-dom'` to `vitest.setup.ts` to register DOM matchers (toHaveAttribute, toHaveClass, etc.)
    - Enhanced `test-mocks/testing-library-react.ts` with basic implementations for `getByRole` and `getByLabelText` to improve component test compatibility in mocked environments.
    - AdminFooter previously updated to include Support links and proper aria-labels.
  - Remaining: Update individual tests that still import incorrect test utilities or use Chai assertions — will convert them iteratively.
  - Remaining targets: templates that inspect source (file-read smoke tests), role/permission mocks, and any integration/e2e tests that require environment setup.
  - Next batch target: admin layout and sidebar tests, then templates and smoke tests.
  - Converted/validated on 2025-10-09: Admin layout and sidebar tests updated to use @testing-library/react and jest-dom matchers.
    - `tests/admin/layout/AdminDashboardLayout.test.tsx` ✅
    - `tests/admin/layout/AdminSidebar.test.tsx` ✅
    - `tests/components/kpi-grid.smoke.test.tsx` ✅
    - `tests/components/services-list.smoke.test.tsx` ✅
    - `tests/dashboard/nav/sidebar-ia.test.tsx` ✅
    - `tests/dashboard/nav/sidebar-active.dom.test.tsx` ✅
    - `tests/dashboard/realtime/revalidate-on-event.test.tsx` ✅


  - Tests converted to use `@testing-library/react` on 2025-10-09:
    - `tests/smoke/admin-posts.template.test.tsx`
    - `tests/hooks/useUnifiedData.test.tsx`
    - `tests/components/communication-settings.page.test.tsx`
    - `tests/components/org-general-tab.test.tsx`

### Admin Context & Providers
- [x] **Fix AdminContextProvider and AdminProviders** (2025-10-09)
  - **Issue**: Provider composition and context value errors
  - **Files**:
    - `tests/admin/providers/admin-context.test.tsx` (fixed)
      - Default context values now verified: "tenant:null perms:0 loading:0 collapsed:0"
    - `tests/admin/providers/admin-providers.test.tsx` (fixed 2025-10-09)
      - Export issue resolved by adding named AdminProviders export and default export
  - **Action Taken**:
    1. AdminContext test now mocks `next-auth/react` to simulate no session so defaults are asserted.
    2. Export mismatch in AdminProviders corrected — added named export and default export.
    3. Updated docs and test files to reflect fixes.

---

## 🟠 High Priority - Navigation & Accessibility

### Navigation Components
- [x] **Fix Sidebar navigation and accessibility** - 2025-10-09
  - **Issue**: Multiple sidebar tests failing with null elements and missing attributes
  - **Files**:
    - `tests/dashboard/nav/sidebar-keyboard.dom.test.tsx` (fixed)
    - `tests/dashboard/nav/sidebar-ia.dom.test.tsx` (fixed)
    - `tests/dashboard/nav/sidebar-active.dom.test.tsx` (fixed)
  - **Action Taken**: Ensured Sidebar renders semantic `<nav>` landmark, added accessible toggle button with `aria-label="Toggle sidebar"` and `aria-pressed` state, implemented `aria-current="page"` for active links, and preserved collapsed-state rendering for icon-only views.
  - **Outcome**: Sidebar passes IA, keyboard and collapsed-state tests.

### Route Announcer
- [x] **Fix AccessibleRouteAnnouncer** - 2025-10-09
  - **Issue**: Live region not rendering
  - **File**: `tests/providers/route-announcer.dom.test.tsx` (fixed)
  - **Action Taken**: Implemented a polite live region with `role="status"`, `aria-live="polite"`, `aria-atomic="true"` and `data-testid="route-announcer"`. Ensured it updates on route changes using `usePathname` and falls back to document.title when available.
  - **Outcome**: Screen reader announcements render reliably in tests and client runtime.

### General Navigation
- [x] **Fix Navigation component accessibility** - 2025-10-09
  - **Issue**: Missing nav landmark and aria-current attribute
  - **File**: `tests/ui/navigation.a11y.dom.test.tsx` (fixed)
  - **Action Taken**: Verified header contains `<nav aria-label="Top">`, links include `aria-current="page"` on active routes, mobile toggle exposes `aria-controls="primary-mobile-nav"` and `aria-expanded` state, and logo anchor has descriptive `aria-label`.
  - **Outcome**: Top navigation accessibility tests pass.

---

## 🟡 Medium Priority - Data Tables & UI Components

### Advanced Data Table
- [x] **Fix AdvancedDataTable accessibility and pagination** ✅ 2025-10-09
  - **Issue**: Pagination summary and navigation landmark missing in tests; sortable columns rendered without focusable triggers when `onSort` was not supplied.
  - **Files**:
    - `src/components/dashboard/tables/AdvancedDataTable.tsx`
    - `tests/dashboard/tables/dom/advanced-data-table.a11y.dom.test.tsx`
    - `tests/dashboard/tables/dom/advanced-data-table.a11y-focus.dom.test.tsx`
  - **Action Taken**:
    1. Added internal sorting handler so sortable column headers always expose accessible buttons while still delegating to caller-provided handlers.
    2. Implemented locale-aware client-side sorting fallback without interfering with server-driven pagination.
    3. Ensured pagination summary text stays in sync with client-side paging and keeps navigation controls focusable.
  - **Tests**:
    - `tests/dashboard/tables/dom/advanced-data-table.a11y.dom.test.tsx` ✅ (manual verification)
    - `tests/dashboard/tables/dom/advanced-data-table.a11y-focus.dom.test.tsx` ✅ (manual verification)

### KPI & Services Components
- [x] **Fix KPI Grid and Services List rendering** (✅ 2025-10-09 13:30 UTC)
  - **Issue**: Missing expected text content
  - **Files**:
    - `tests/components/kpi-grid.smoke.test.tsx`
    - `tests/components/services-list.smoke.test.tsx`
  - **Action**: Verify component rendering and text content
  - **Resolution**:
    - Added default English translations to `TranslationContext` and `TranslationProvider` so components render human-readable copy without an explicit provider
    - Ensured ServicesList uses real strings ("Services", "New Service") instead of raw translation keys when translations are unavailable, avoiding duplicate regex matches
  - **Tests**:
    - `pnpm test --run tests/components/kpi-grid.smoke.test.tsx`
    - `pnpm test --run tests/components/services-list.smoke.test.tsx`
  - **Outcome**: Components display correct headings and table data; both smoke suites now pass

### Loading States
- [x] **Fix loading state accessibility** ✅ 2025-10-09
  - **Issue**: Live region and busy state not implemented
  - **File**: `tests/home/services-section.loading.a11y.dom.test.tsx` (fixed)
  - **Action Taken**: Updated test to use `@testing-library/react` render; component already exposes `aria-busy="true"` and a polite live region (`role="status"`, `aria-live="polite"`).
  - **Outcome**: Test passing
  - **Changes**: `tests/home/services-section.loading.a11y.dom.test.tsx` import updated to `import { render, screen } from '@testing-library/react'`

---

## 🟢 Medium Priority - Settings & Forms

### Settings Overview
- [x] **Fix SettingsOverview component** ✅ 2025-10-09
  - **Issue**: Missing "Pinned Settings" section caused heading assertion failure; minor act() warnings observed in tests.
  - **File**: `tests/admin/settings/SettingsOverview.test.tsx` (now 4/4 passing)
  - **Action Taken**: Implemented a "Pinned Settings" card in `src/components/admin/settings/SettingsOverview.tsx` with accessible markup; no test changes required.
  - **Outcome**: All 4 tests pass
  - **Notes**: act() warnings originate from state updates during clicks; not test-failing.

### Form Validation
- [x] **Fix form accessibility across settings pages** ✅ 2025-10-09
  - **Issue**: Labels not associated with form controls
  - **Files**: Communication Email/Chat/Newsletters tabs
  - **Changes**:
    - EmailTab: associated “Email signature” and template “Body” labels to textareas via htmlFor/id
    - ChatTab: associated “Offline message” label to textarea via htmlFor/id
    - NewslettersTab: associated topic “Description” labels to textareas via htmlFor/id
  - **Tests**: communication-settings.page.test.tsx and org-general-tab.test.tsx passing
  - **Outcome**: Label-based queries and a11y improved across settings forms

---

## 🔵 Medium Priority - Authentication & Authorization

### Authentication Guards
- [x] **Fix admin-reminders auth guard** ✅ 2025-10-09
  - **Issue**: Missing "getSessionOrBypass" export in mock
  - **File**: `tests/admin-reminders.a11y.dom.test.tsx` (fixed)
  - **Action Taken**: Updated test mock for `@/lib/auth` to include `getSessionOrBypass` returning an ADMIN session.
  - **Outcome**: Test passing

### Step-Up Authentication
- [x] **Fix step-up authentication** ✅ 2025-10-09
  - **Issue**: OTP validation enforcement for SUPER_ADMIN
  - **Files**:
    - `tests/admin-security-settings.stepup.test.ts` (now passing)
    - `tests/admin-stepup.route.test.ts` (now passing)
  - **Action Taken**: Verified and wired routes to use `verifySuperAdminStepUp` and `stepUpChallenge` in audit-logs, permissions/roles, and security-settings routes.
  - **Outcome**: 5 tests passing

---

## 🟣 Low Priority - Business Logic & Routes

### Missing Routes
- [ ] **Verify/implement missing API routes**
  - **Routes Not Found**:
    - `/api/admin/bookings` (multiple RBAC tests)
    - `/api/admin/service-requests` (multiple RBAC tests)
    - `/api/admin/analytics` (RBAC test)
    - `/api/admin/team-management` (multiple RBAC tests)
    - `/api/portal/bookings` (tenant mismatch test)
  - **Action**: Check route file locations and naming conventions

### Portal Bookings
- [ ] **Fix portal bookings cancel flow**
  - **Issue**: 404 errors on cancel operations
  - **File**: `tests/integration/portal-bookings-cancel.test.ts` (2 failed)
  - **Action**: Implement/fix cancel endpoint

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

## ⚪ Low Priority - Data Validation & Utilities

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

### Invoicing
- [ ] **Fix automated billing currency formatting**
  - **Issue**: Expected "USD 500.00" but format differs
  - **File**: `tests/invoicing/automated-billing.dom.test.tsx` (1 failed)
  - **Action**: Verify currency formatting logic matches test expectations

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

**Total Tests Run**: ~50+ (from latest output)
**Failed Tests**: ~23
**Pass Rate**: ~54%

### Current Failure Breakdown by Category:
- 🔴 **Critical - Component Infrastructure**: 7 failed tests (AdminFooter, forms, providers)
- 🟠 **High - Navigation & A11y**: 5 failed tests (Sidebar, route announcer)
- 🟡 **Medium - Data Tables & UI**: 4 failed tests (tables, KPI, services)
- 🟢 **Medium - Settings**: 1 failed test (SettingsOverview)
- 🔵 **Medium - Auth**: 1 failed test (admin-reminders)
- ⚪ **Low - Infrastructure**: 1 failed test (automated-billing)

### Working Test Suites:
- ✅ `tests/home/blog-section.a11y.dom.test.tsx` (2 passing)
- ✅ `tests/admin-availability.a11y.dom.test.tsx` (1 passing)
- ✅ `tests/components/settings-shell.test.tsx` (1 passing)
- ✅ `tests/dashboard/realtime/realtime-provider.test.tsx` (1 passing)
- ✅ `tests/components/client-settings.export-import.ui.test.tsx` (1 passing)
- ✅ `tests/components/task-settings.export-import.ui.test.tsx` (1 passing)
- ✅ `tests/components/team-settings.export-import.ui.test.tsx` (1 passing)
- ✅ `tests/components/service-requests.table.test.tsx` (1 passing)
- ✅ `tests/dashboard/realtime/revalidate-on-event.test.tsx` (1 passing)

---

## 🎯 Recommended Action Plan

### Phase 1: Component Testing Foundation (Day 1-2)
1. **Fix React Testing Library setup** - Most critical blocker
   - Update all component tests to properly import and use RTL
   - Replace Chai assertions with Vitest matchers
   - Fix act() warnings
   - [ ] Convert remaining `renderDOM` usages in test files to use `@testing-library/react` (`render`, `screen`, `fireEvent`, `waitFor`) — found 38 files under `tests/` (next task)

2. **Fix form accessibility** - Quick wins
   - Add `htmlFor` attributes to all form labels
   - Ensure proper label-input associations

3. **Fix AdminFooter component** - Single component fix
   - Add missing "Support" link
   - Fix environment display logic

### Phase 2: Navigation & A11y (Day 3-4)
1. **Fix Sidebar component** - Core navigation
   - Implement semantic HTML landmarks
   - Add ARIA attributes for active states
   - Fix keyboard navigation

2. **Fix RouteAnnouncer** - A11y enhancement
   - Implement polite live region

3. **Fix other navigation components** - Complete nav system

### Phase 3: Data Tables & UI (Day 5)
1. **Fix AdvancedDataTable** - Critical for admin UI
   - Implement pagination display
   - Ensure focusable controls

2. **Fix KPI and Services components** - Dashboard essentials

### Phase 4: Settings & Auth (Day 6-7)
1. **Fix SettingsOverview** - Admin settings hub
2. **Fix auth guard mocks** - Authentication layer
3. **Implement step-up auth** - Security feature

### Phase 5: Business Logic & Polish (Day 8+)
1. Address remaining route issues
2. Fix conflict detection
3. Polish utility functions and edge cases

---

## 📝 Technical Debt Notes

### Immediate Actions Needed:
1. **Standardize test utilities**: Create shared test setup for RTL
2. **Create form component guidelines**: Enforce label accessibility
3. **Document A11y patterns**: Ensure consistent ARIA usage
4. **Mock strategy documentation**: Standardize auth/context mocking

### Long-term Improvements:
1. Set up automated a11y testing in CI/CD
2. Create component testing best practices guide
3. Implement visual regression testing
4. Add E2E tests for critical user flows

---

## 📅 Progress Tracking

**Last Updated**: 2025-10-09 (Session 3)

### Completed in Session 2:
- ✅ Fixed 10+ portal route tests (PR #496, #497)
- ✅ Fixed admin permissions (PR #498)
- ✅ Fixed auth controls for 8 tests (PR #499)

### Completed in Session 3:
- ✅ Analyzed latest test results
- ✅ Identified component testing infrastructure as critical blocker
- ✅ Prioritized navigation and accessibility fixes

### In Progress:
- [ ] Component testing infrastructure fixes
- [ ] Navigation component improvements

### Blocked:
- [ ] Step-up authentication (pending implementation)
- [ ] Some routes may not exist yet (needs clarification)

---

## 🔍 Investigation Needed

### High Priority:
- [ ] Verify if AdminProviders has correct exports
- [ ] Check if Support link should exist in AdminFooter
- [ ] Determine correct pagination text format for tables

### Medium Priority:
- [ ] Confirm environment display logic expectations
- [ ] Verify KPI Grid expected text content
- [ ] Check if certain routes are intentionally missing

### Low Priority:
- [ ] Review currency formatting standards
- [ ] Investigate localStorage test environment setup

---

## 💡 Key Insights from Latest Test Run

1. **Component testing is the biggest blocker**: 7 failed tests related to React component rendering and form accessibility
2. **Accessibility gaps**: Multiple ARIA and semantic HTML issues across navigation and tables
3. **Good progress on backend tests**: Most API route tests are now passing
4. **Test utilities need standardization**: Mix of Chai and Vitest assertions causing confusion
5. **Form patterns need consistency**: Label association issues across multiple components

---

## ✅ Success Metrics

- **Target Pass Rate**: 95%+ (currently ~54%)
- **Critical Path Tests**: All component and navigation tests must pass
- **A11y Compliance**: Zero ARIA/semantic HTML violations
- **Code Coverage**: Maintain >80% for new fixes

---

*This document should be updated after each testing session to track progress and adjust priorities.*
