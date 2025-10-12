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
### 3.2 Legacy Layout Removal
- [x] Locate and remove `app/admin/layout-nuclear.tsx` and `app/admin/page-nuclear.tsx` plus any residual imports.
- [x] Replace legacy references with canonical layout exports.
- [x] Verify build after removal and run smoke tests on `/admin/*` routes.
- [x] Satisfy architecture clean-up goals from `docs/NextAccounting Admin Dashboard.md` §3.1 and Moderniza Task 1.2.

### 3.3 Navigation Registry Consolidation
- [ ] Implement `src/lib/admin/navigation-registry.ts` with full section/item metadata (labels, icons, permissions, badges, keywords, descriptions).
- [ ] Remove hardcoded arrays from `AdminSidebar`, breadcrumbs, search, and any duplicated navigation definitions.
- [ ] Ensure registry eliminates stale entries (e.g., remove Invoices “Templates” link) and normalizes URLs.
- [ ] Add Jest/Vitest coverage for item lookup, permission filtering, search, breadcrumbs, favorites, and recent history utilities.
- [ ] Align navigation model with consolidation requirements in `docs/NextAccounting Admin Dashboard.md` §3.2–§3.3 and Moderniza Task 1.3.

---

## Status Log

### Guideline Alignment Overview
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Reviewed and aligned with `docs/NextAccounting Admin Dashboard.md` and `docs/NextAccounting Admin Dashboard Moderniza.md`; extracted success metrics and phase plan.
- Files Modified: docs/admin-dashboard-upgrade-todo.md
- Notes: Benchmarks confirmed (Lighthouse ≥90, WCAG 2.1 AA, 20% bundle reduction, P99 < 400ms). Cross-referenced `docs/admin-dashboard-structure-audit.md`.

### Legacy Layout Removal
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Removed legacy admin layout variants to prevent inconsistencies.
- Files Modified: src/app/admin/layout-nuclear.tsx, src/app/admin/page-nuclear.tsx, docs/admin-dashboard-upgrade-todo.md
- Notes: No active imports found. Sidebar, header, and pages already use canonical layout.

### Navigation Registry Consolidation
- Status: ⚠️ In Progress
- Date: 2025-10-12
- Changes: Added centralized registry at `src/lib/admin/navigation-registry.ts` and refactored `AdminSidebar` to consume it. Removed stale Invoices “Templates” link.
- Files Modified: src/lib/admin/navigation-registry.ts, src/components/admin/layout/AdminSidebar.tsx, docs/admin-dashboard-upgrade-todo.md
- Notes: Next steps: wire registry into breadcrumbs/search and add unit tests.
