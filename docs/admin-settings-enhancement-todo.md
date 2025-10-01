# Admin Settings Enhancement — Roadmap & TODO

## Summary
This document tracks the completed work and the next-phase implementation plan to build a professional Settings Overview (admin) aligned with the current Admin Dashboard.

## Completed (previous refactor work)
- [x] Refactor AdminSidebar to nest system links under Settings with consolidated submenu
- [x] Register /admin/settings overview in SETTINGS_REGISTRY
- [x] Fix import path for SettingsNavigation in /admin/settings page
- [x] Resolve TypeScript mismatch by adding 'overview' to SettingsCategoryKey
- [x] Refactor/update permission checks, analytics hooks, and tests impacted by navigation changes
- [x] Run typecheck and sidebar/navigation test suites (skipped execution per request)
- [x] Manually verify Settings submenu behavior and permissions in admin UI

---

## New Work: Settings Overview (priority)
Goal: Build a polished Settings Overview page that matches the admin dashboard aesthetic and workflow. Provide quick system health checks, actionable controls, recent activity, and fast access to frequently-used settings.

Implementation checklist (actionable, ordered):

1. [x] Design & content spec (Deliverable: Figma or image + MD) — implemented at docs/admin-settings-overview-spec.md
   - Define the Overview layout: top KPI/status cards, quick-actions, recent activity/audit trail, pinned settings, and contextual help.
   - Create content for each card (DB, Auth, Payments, Integrations, Deploy/Env, Last config change).
   - Accessibility and responsive considerations.

2. [x] SettingsOverview component (src/components/admin/settings/SettingsOverview.tsx) - implemented and wired into /admin/settings page
   - Use existing SettingsShell, SettingsCard components for visual parity.
   - Implement responsive card grid and sections for "System Health", "Quick Actions", "Recent Changes", and "Pinned Settings".
   - Add placeholders for actions (export/import, run diagnostics) wired to service calls.

3. [x] Service endpoints & client helpers
   - Implemented minimal endpoints and client helpers in src/services/settings.service.ts. Routes added: /api/admin/settings/diagnostics (POST), /api/admin/settings/export (GET), /api/admin/settings/import (POST).
   - Import route validates payload with zod and returns structured responses.

4. [x] Registry & routing
   - Overview component wired into /admin/settings page and consumes SETTINGS_REGISTRY for nav integration.
   - No additional route file required; the existing page renders the Overview component.

5. [x] Quick actions implementation
   - Implemented actions: "Run Connection Test", "Export Settings (JSON)", "Import Settings" via client helpers and server routes.
   - Server routes added: /api/admin/settings/diagnostics (POST), /api/admin/settings/export (GET), /api/admin/settings/import (POST) with basic validation.
   - Client helpers added in src/services/settings.service.ts and wired to the overview UI.

6. [x] Sidebar behavior: Disable expand/collapse for Settings in AdminSidebar
   - Make the Settings parent entry always expanded and non-collapsible so its submenu items are always visible.
   - Implementation: treat the Settings item's children as static sublinks (do not toggle via expandedSections). Ensure permissions still filter items and active-route highlighting works.
   - Update AdminSidebar tests to assert Settings submenu is always visible and not affected by collapse state.

7. [ ] Tests
   - Implement actions: "Run Connection Test", "Export Settings (JSON)", "Import Settings". Use existing API endpoints and ensure RBAC checks.
   - Confirm imports validate JSON payloads server-side and return meaningful errors.

6. [ ] Tests
   - Unit tests for SettingsOverview rendering and card states.
   - Integration tests for quick actions (mock service responses).
   - Add e2e tests (Playwright) that cover visibility and actions for an admin user.

7. [ ] Accessibility & Performance
   - Run an accessibility pass and fix issues (ARIA, keyboard nav, color contrast).
   - Ensure lazy-loading of heavy widgets (charts, logs) and server-side caching where appropriate.

8. [ ] Documentation & rollout
   - Update docs/admin-settings-enhancement-todo.md and components README describing use and how to extend registry widgets.
   - Create developer notes for deploying (Netlify build variables, monitoring URLs) and telemetry events to instrument.

9. [ ] Deploy & monitor
   - Deploy to staging, run smoke tests, and monitor Sentry/telemetry for 24h after rollout.

---

## Deliverables & Acceptance Criteria
- Settings Overview page implemented and accessible at /admin/settings for users with view permission.
- All quick actions function and return success/failure states in UI.
- RBAC respected: users without numeric permissions cannot view or act on restricted items.
- Unit and integration tests added; Playwright e2e added.
- Documented design, APIs, and rollout plan in this repo.

---

## Notes
- Reuse existing components (SettingsShell, SettingsCard, StandardPage) and services wherever possible.
- For design parity with marketing/home pages, consult src/components/home/hero-section.tsx and admin dashboard components for spacing and card patterns.
- If you want, I can implement the SettingsOverview component and related services and open a PR.
