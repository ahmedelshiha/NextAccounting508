# NextAccounting Admin Dashboard Upgrade TODO

## Guideline Alignment Overview
- [x] Follow `docs/NextAccounting Admin Dashboard.md` §1–§15 for architectural, UX, performance, security, and accessibility directives.
- [x] Apply `docs/NextAccounting Admin Dashboard Moderniza.md` Phase plans (Foundation, Experience Modernization, Personalization, Hardening) when sequencing deliverables.
- [x] Cross-reference `docs/admin-dashboard-structure-audit.md` route/component inventory to validate coverage and avoid regressions.

## 1. Program Charter & Guardrails
- [x] Confirm modernization goals align with QuickBooks, Notion, and Linear UX benchmarks defined in `docs/NextAccounting Admin Dashboard.md` §1.3 and `docs/NextAccounting Admin Dashboard Moderniza.md` Executive Summary.
- [x] Confirm modernization goals align with QuickBooks, Notion, and Linear UX benchmarks.
- [x] Lock success metrics: ≥20% bundle reduction, Lighthouse ≥90 Performance/Accessibility/Best Practices, WCAG 2.1 AA compliance, P99 API latency < 400 ms.
- [x] Define release cadence (10-week roadmap) and checkpoint demos at end of each phase (see `docs/release-cadence.md`).
- [x] Publish communication plan covering engineering, design, QA, support, and stakeholder updates (see `docs/communication-plan.md`).
- [x] Establish rollback strategy and dependency freeze windows for risky rollouts (see `docs/rollback-strategy.md`).

## 2. Discovery & Planning (Week 0)
- [x] Audit current Admin KPIs (usage analytics, hot routes, pain points) to prioritize navigation placement (see `docs/admin-kpi-audit.md`).
- [x] Validate feature inventory against `docs/NextAccounting Admin Dashboard.md` and `docs/NextAccounting Admin Dashboard Moderniza.md` to ensure no scope gaps (see `docs/admin-dashboard-structure-audit.md`).
- [x] Inventory all admin routes (per `docs/admin-dashboard-structure-audit.md`) and map each to navigation IDs (see `docs/admin-navigation-mapping.md`).
- [x] Confirm backend readiness for new aggregate endpoints, menu customization tables, and health checks (see `docs/admin-backend-readiness.md`).
- [x] Prepare design references and component specs for QuickBooks-inspired patterns (sidebar, footer, dropdowns) (see `docs/admin-design-references.md`).

## 3. Phase 1 – Foundation & Cleanup (Weeks 1–2)
### 3.3 Navigation Registry Consolidation
- [x] Implement `src/lib/admin/navigation-registry.ts` with full section/item metadata (labels, icons, permissions, badges, keywords) and utilities (breadcrumbs, search).
- [x] Refactor `AdminSidebar` and `AdminHeader` to consume registry.
- [x] Add tests for breadcrumbs, search, and permission filtering.

### 3.4 Layout Store Unification
- [x] Consolidate into a single Zustand store at `src/stores/admin/layout.store.ts` with hydration guards and persistence.
- [x] Update imports in `AdminDashboardLayout` to use `useAdminLayoutSafe`.
- [x] Delete obsolete store files: `src/stores/adminLayoutStoreHydrationSafe.ts`, `src/stores/adminLayoutStoreSSRSafe.ts`.

---

## Status Log

### Layout Store Unification
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added unified store `src/stores/admin/layout.store.ts` with hydration-safe API; switched `AdminDashboardLayout` to `useAdminLayoutSafe`; removed legacy stores.
- Files Modified: src/stores/admin/layout.store.ts, src/components/admin/layout/AdminDashboardLayout.tsx
- Notes: Persisted keys: sidebarCollapsed, expandedGroups. Future: migrate any other consumers to selector hooks if needed.

### Broaden Tests – Permissions Edge Cases
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added edge case coverage for PermissionGate (array vs single, undefined role fallback) and permissions utilities (hasRole undefined inputs, hasPermission null/empty role, checkPermissions with duplicates).
- Files Modified: tests/components/permission-gate.edge-cases.dom.test.tsx, tests/lib/permissions.edge-cases.test.ts
- Notes: Validated existing API RBAC tests already cover TEAM_LEAD vs ADMIN differences for booking settings import/reset. No production code changes required.

### Phase 2 – Sidebar Subcomponents (Initial Extraction)
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Extracted AdminSidebar into subcomponents (header, nav, footer, resizer) keeping identical styles, ARIA, and behavior. Wired new components without altering layout.
- Files Modified: src/components/admin/layout/AdminSidebar.tsx
- Files Added: src/components/admin/layout/Sidebar/SidebarHeader.tsx, src/components/admin/layout/Sidebar/SidebarFooter.tsx, src/components/admin/layout/Sidebar/SidebarResizer.tsx, src/components/admin/layout/Sidebar/SidebarNav.tsx
- Notes: No visual or behavioral changes; nav rendering logic moved to SidebarNav. Follow-ups: add unit tests for SidebarNav interactions and keyboard navigation.

### Phase 2 – Sidebar Tests (Unit & Interaction)
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added unit tests covering SidebarNav rendering, permission filtering, and a hook test for sidebar keyboard shortcuts.
- Files Added: tests/components/admin/sidebar-nav.dom.test.tsx, tests/hooks/useSidebarShortcuts.test.ts
- Files Modified: docs/admin-dashboard-upgrade-todo.md
- Notes: Tests validate group toggle behavior and keyboard shortcut handling (Mod+B, Mod+[ and Mod+]). Further work: add e2e tests for drag resize and keyboard workflow in Playwright.

### Phase 2 – Sidebar Tests (Execution)
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Executed new unit tests for SidebarNav and useSidebarShortcuts — all new tests passed locally via Vitest.
- Files Added: tests/components/admin/sidebar-nav.dom.test.tsx, tests/hooks/useSidebarShortcuts.test.ts
- Notes: Next: implement Playwright e2e test to validate drag resizing and keyboard shortcuts in a real browser environment.

### Phase 2 – Sidebar E2E
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added Playwright e2e test and CI workflow to validate keyboard toggling (Mod+B) and drag-resize behavior on desktop.
- Files Added: e2e/tests/admin-sidebar.spec.ts, .github/workflows/playwright-e2e.yml
- Notes: CI workflow runs on push/PR to main:
  - installs dependencies and Playwright browsers
  - builds using build:skip-env
  - starts the app and runs Playwright tests
  - uploads the HTML report

To run locally instead, execute:
  - pnpm exec playwright install --with-deps
  - E2E_BASE_URL="http://localhost:3000" pnpm exec playwright test e2e/tests/admin-sidebar.spec.ts -c e2e/playwright.config.ts --project=chromium

### Build Fixes Applied
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Fixed ESLint/TypeScript errors reported during Vercel build.
  - Removed an empty interface in src/components/admin/layout/AdminSidebar.tsx that caused @typescript-eslint/no-empty-object-type.
  - Adjusted src/stores/admin/layout.store.ts to call Zustand selector hooks unconditionally (useSidebarState, useNavigationState, useUIState) to satisfy react-hooks/rules-of-hooks, while preserving previous hydration fallback behavior.
  - Fixed TypeScript errors in AdminSidebar by:
    - Importing useRovingTabIndex from src/hooks/useRovingTabIndex
    - Changing mapItem return type to NavItem to match SidebarNav types
  - Restored legacy compatibility hook at src/stores/adminLayoutStoreSSRSafe.ts to satisfy imports from ClientOnlyAdminLayout.
- Files Modified: src/components/admin/layout/AdminSidebar.tsx, src/stores/admin/layout.store.ts
- Files Added: src/stores/adminLayoutStoreSSRSafe.ts
- Notes: Please re-run the Vercel build; I couldn't run the build in this environment due to policy restrictions. If further TS errors appear, share the log and I'll address them immediately.

### Phase 2 – Sidebar Resize & Shortcuts
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Implemented keyboard shortcuts for sidebar (Mod+B toggle, Mod+[ collapse, Mod+] expand) with a lightweight hook that avoids adding new dependencies. SidebarResizer component added earlier supports mouse/touch resizing.
- Files Modified: src/components/admin/layout/AdminSidebar.tsx
- Files Added: src/hooks/admin/useSidebarShortcuts.ts
- Notes: Chose to implement shortcuts without react-hotkeys-hook to avoid adding runtime dependency. Follow-ups: add e2e tests for drag/keyboard behaviors and document shortcut mappings in user help.

### Legacy Store Compatibility Shim
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Replaced legacy store implementation in src/stores/adminLayoutStore.ts with a thin compatibility layer that re-exports the unified store API from src/stores/admin/layout.store.ts (selectors and useAdminLayout). This eliminates duplicate state sources while keeping legacy imports working.
- Files Modified: src/stores/adminLayoutStore.ts
- Notes: SSRSafe wrapper remains as a small adapter. All new code should import from src/stores/admin/layout.store.ts directly.

### Release Cadence & Checkpoints
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added 10-week roadmap with demos and release criteria.
- Files Added: docs/release-cadence.md
- Notes: Includes ceremonies, metrics, and risk controls.

### Communication Plan
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Published cross-functional comms plan with channels, cadence, and templates.
- Files Added: docs/communication-plan.md
- Notes: Tie-ins to incidents and weekly status reports.

### Rollback Strategy
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Documented flags, DB migration policy, deploy rollback steps, freeze windows.
- Files Added: docs/rollback-strategy.md
- Notes: Aligns with Netlify/Vercel capabilities and Prisma workflows.

### Admin KPI Audit
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Defined KPIs, identified hot routes, and prioritized UX actions.
- Files Added: docs/admin-kpi-audit.md
- Notes: Uses existing stats endpoints; no backend gaps.

### Navigation Mapping to Registry
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Mapped nav IDs to routes from registry for traceability.
- Files Added: docs/admin-navigation-mapping.md
- Notes: Ensures sidebar/search/breadcrumbs consistency.

### Backend Readiness Confirmation
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Audited admin API endpoints for aggregates, health, and import/export.
- Files Added: docs/admin-backend-readiness.md
- Notes: READY; menu customization can be deferred or modeled later.

### Design References & Component Specs
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added design/behavior specs for sidebar, header, settings shell, and shortcuts.
- Files Added: docs/admin-design-references.md
- Notes: Benchmarks: QuickBooks, Notion, Linear.
