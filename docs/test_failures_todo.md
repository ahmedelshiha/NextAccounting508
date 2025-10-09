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

---

## 🔴 Critical - Component Testing Infrastructure (HIGH PRIORITY)

### React Testing Library Setup Issues
- [ ] **Fix component test render configuration**
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
  - Progress (2025-10-09): AdminFooter updated to include branding, version (v2.3.2), release date (Sept 26, 2025), desktop support links (Admin Help, Documentation), explicit environment display ("production"/"development"), and "System Operational" status. Remaining: form label associations and test matcher/config updates.

### Admin Context & Providers
- [ ] **Fix AdminContextProvider and AdminProviders**
  - **Issue**: Provider composition and context value errors
  - **Files**:
    - `tests/admin/providers/admin-context.test.tsx` (1 failed)
      - Expected text not found: "tenant:null perms:0 loading:0 collapsed:0"
    - `tests/admin/providers/admin-providers.test.tsx` (1 failed)
      - RENDER_ERROR: Element type invalid (undefined export)
  - **Action**: 
    1. Verify AdminContextProvider exports correct values
    2. Check AdminProviders composition and component exports
    3. Ensure all provider components are properly exported

---

## 🟠 High Priority - Navigation & Accessibility

### Navigation Components
- [ ] **Fix Sidebar navigation and accessibility**
  - **Issue**: Multiple sidebar tests failing with null elements and missing attributes
  - **Files**:
    - `tests/dashboard/nav/sidebar-keyboard.dom.test.tsx` (1 failed)
      - Navigation landmark and toggle button not found
    - `tests/dashboard/nav/sidebar-ia.dom.test.tsx` (1 failed)
      - Nav links not rendering when collapsed
    - `tests/dashboard/nav/sidebar-active.dom.test.tsx` (1 failed)
      - aria-current and active classes not applied
  - **Action**: 
    1. Ensure Sidebar renders with proper semantic HTML (`<nav>` landmark)
    2. Add accessible toggle button with ARIA labels
    3. Implement aria-current="page" for active routes
    4. Fix collapsed state rendering
  - **Expected Outcome**: Sidebar passes all a11y and keyboard navigation tests

### Route Announcer
- [ ] **Fix AccessibleRouteAnnouncer**
  - **Issue**: Live region not rendering
  - **File**: `tests/providers/route-announcer.dom.test.tsx` (1 failed)
  - **Action**: Implement polite live region for route changes
  - **Expected Outcome**: Screen reader users get route change announcements

### General Navigation
- [ ] **Fix Navigation component accessibility**
  - **Issue**: Missing nav landmark and aria-current attribute
  - **File**: `tests/ui/navigation.a11y.dom.test.tsx` (1 failed)
  - **Action**: Add semantic navigation elements and ARIA attributes

---

## 🟡 Medium Priority - Data Tables & UI Components

### Advanced Data Table
- [ ] **Fix AdvancedDataTable accessibility and pagination**
  - **Issue**: Pagination text and navigation landmark missing
  - **Files**:
    - `tests/dashboard/tables/dom/advanced-data-table.a11y.dom.test.tsx` (1 failed)
      - Text not found: "Page 1 of 2"
    - `tests/dashboard/tables/dom/advanced-data-table.a11y-focus.dom.test.tsx` (1 failed)
      - Header sort and pagination buttons not focusable
  - **Action**: 
    1. Add pagination text display
    2. Ensure all interactive elements are focusable
    3. Add navigation landmark for pagination
  - **Expected Outcome**: Table passes WCAG 2.1 AA standards

### KPI & Services Components
- [ ] **Fix KPI Grid and Services List rendering**
  - **Issue**: Missing expected text content
  - **Files**:
    - `tests/components/kpi-grid.smoke.test.tsx` (1 failed)
      - Expected text "Key Performance Indicators" not found
    - `tests/components/services-list.smoke.test.tsx` (1 failed)
      - Expected text matching services pattern not found
  - **Action**: Verify component rendering and text content
  - **Expected Outcome**: Components display correct headings and content

### Loading States
- [ ] **Fix loading state accessibility**
  - **Issue**: Live region and busy state not implemented
  - **File**: `tests/home/services-section.loading.a11y.dom.test.tsx` (1 failed)
  - **Action**: Add aria-live="polite" and aria-busy attributes during loading

---

## 🟢 Medium Priority - Settings & Forms

### Settings Overview
- [ ] **Fix SettingsOverview component**
  - **Issue**: Invalid Chai property and React state updates
  - **File**: `tests/admin/settings/SettingsOverview.test.tsx` (1 failed of 4)
  - **Action**: 
    1. Replace Chai assertions with Vitest matchers
    2. Wrap state updates in act()
    3. Fix `toBeInTheDocument` usage
  - **Expected Outcome**: All 4 tests pass

### Form Validation
- [ ] **Fix form accessibility across settings pages**
  - **Issue**: Labels not associated with form controls
  - **Files**: Multiple settings component tests
  - **Pattern**: Using `<label>` without `htmlFor` or proper association
  - **Action**: Add `htmlFor` attribute to all label elements
  - **Expected Outcome**: All form controls are accessible

---

## 🔵 Medium Priority - Authentication & Authorization

### Authentication Guards
- [ ] **Fix admin-reminders auth guard**
  - **Issue**: Missing "getSessionOrBypass" export in mock
  - **File**: `tests/admin-reminders.a11y.dom.test.tsx` (1 failed)
  - **Action**: Update @/lib/auth mock to include getSessionOrBypass export
  - **Expected Outcome**: Auth guard properly enforces authentication

### Step-Up Authentication
- [ ] **Fix step-up authentication**
  - **Issue**: OTP validation not enforcing (expected 401, got 200)
  - **Files**: 
    - `tests/admin-security-settings.stepup.test.ts` (2 failed)
    - `tests/admin-stepup.route.test.ts` (2 failed)
  - **Action**: Implement/fix super admin step-up verification
  - **Status**: Blocked pending implementation

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
