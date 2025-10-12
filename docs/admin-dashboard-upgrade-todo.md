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
- [x] Implement `src/lib/admin/navigation-registry.ts` with full section/item metadata (labels, icons, permissions, badges).
- [x] Remove hardcoded arrays from `AdminSidebar` and ensure registry eliminates stale entries (e.g., removed Invoices “Templates”).
- [x] Use registry for breadcrumbs in `AdminHeader` (`getBreadcrumbs`).
- [x] Implement global search routing in header using registry `searchNav`.
- [ ] Add Jest/Vitest coverage for permission filtering, search utilities, favorites, and recent history.

---

## Status Log

### Global Search (Header)
- Status: ✅ Completed
- Date: 2025-10-12
- Changes: Added registry-based search utilities (`buildSearchIndex`, `searchNav`) and wired AdminHeader search submit to navigate to best match.
- Files Modified: src/lib/admin/navigation-registry.ts, src/components/admin/layout/AdminHeader.tsx, tests/admin/navigation-search.test.ts
- Notes: Enhancements like a dropdown results panel and keyboard navigation can be added later without changing the API.
