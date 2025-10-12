# NextAccounting Admin Dashboard Upgrade TODO

## Guideline Alignment Overview
- [x] Follow `docs/NextAccounting Admin Dashboard.md` §1–§15 for architectural, UX, performance, security, and accessibility directives.
- [x] Apply `docs/NextAccounting Admin Dashboard Moderniza.md` Phase plans (Foundation, Experience Modernization, Personalization, Hardening) when sequencing deliverables.
- [x] Cross-reference `docs/admin-dashboard-structure-audit.md` route/component inventory to validate coverage and avoid regressions.

## 1. Program Charter & Guardrails
- [x] Confirm modernization goals align with QuickBooks, Notion, and Linear UX benchmarks defined in `docs/NextAccounting Admin Dashboard.md` §1.3 and `docs/NextAccounting Admin Dashboard Moderniza.md` Executive Summary.
- [x] Confirm modernization goals align with QuickBooks, Notion, and Linear UX benchmarks.
- [x] Lock success metrics: ≥20% bundle reduction, Lighthouse ≥90 Performance/Accessibility/Best Practices, WCAG 2.1 AA compliance, P99 API latency < 400 ms.
- [ ] Define release cadence (10-week roadmap) and checkpoint demos at end of each phase.
- [ ] Publish communication plan covering engineering, design, QA, support, and stakeholder updates.
- [ ] Establish rollback strategy and dependency freeze windows for risky rollouts.

## 2. Discovery & Planning (Week 0)
- [ ] Audit current Admin KPIs (usage analytics, hot routes, pain points) to prioritize navigation placement.
- [ ] Validate feature inventory against `docs/NextAccounting Admin Dashboard.md` and `docs/NextAccounting Admin Dashboard Moderniza.md` to ensure no scope gaps.
- [ ] Inventory all admin routes (per `docs/admin-dashboard-structure-audit.md`) and map each to navigation IDs.
- [ ] Confirm backend readiness for new aggregate endpoints, menu customization tables, and health checks.
- [ ] Prepare design references and component specs for QuickBooks-inspired patterns (sidebar, footer, dropdowns).

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
