# Settings Overview — Design & Content Specification

Path: src/components/admin/settings/SettingsOverview.tsx
Related: src/components/admin/settings/SettingsShell.tsx, SettingsNavigation.tsx

Purpose
- Provide a single, admin-facing dashboard summarizing system health and giving quick access to frequently used settings and actions.
- Mirror visual language of Admin Dashboard: cards, badges, small CTAs, accessible tables and lists.

Layout & Wireframe
- Top-level: SettingsShell with title "Settings Overview" and sidebar SettingsNavigation.
- Content grid (desktop): 3-column responsive grid for primary cards.
  - Card 1 (System Health): Database, Auth, Integrations statuses with badges and "Run Diagnostics" button.
  - Card 2 (Quick Actions): Export Settings, Import Settings, Run Diagnostics (duplicated for convenience).
  - Card 3 (Recent Changes): list of latest config/audit events, timestamps, user.
- Secondary section: "Pinned Settings" (3-column cards linking to specific settings pages).
- Footer section: Troubleshooting & Help links, last successful deploy timestamp, telemetry link.

Responsive behavior
- Mobile: single-column stack. Keep action buttons in a sticky footer or immediately visible within cards.
- Maintain consistent spacing and typography with admin dashboard (use existing Tailwind utility classes and components).

Components & Responsibilities
- SettingsOverview (UI composition)
  - Uses SettingsShell for header and sidebar.
  - Renders SettingsCard instances.
  - Contains handlers for quick actions calling client helpers in src/services/settings.service.ts.
- SettingsCard (presentational) — already available in SettingsShell; keep usage.
- SettingsSection (grouping) — already available.

APIs & Client Helpers
- Client-side helpers (src/services/settings.service.ts):
  - runDiagnostics(): POST /api/admin/settings/diagnostics — returns JSON with quick health flags.
  - exportSettings(): GET /api/admin/settings/export — returns application/json blob for download.
  - importSettings(payload): POST /api/admin/settings/import — server validates via zod and returns status.

Server Routes (minimal implementations)
- POST /api/admin/settings/diagnostics
  - Return status object: { database: boolean, nextauth: boolean, integrations: { stripe: boolean }, timestamp }
- GET /api/admin/settings/export
  - Return a JSON file with minimal exported settings (in prod generate full config payload)
- POST /api/admin/settings/import
  - Validate JSON payload with zod; return 200 on success; in prod persist to DB/config store.

RBAC & Security
- Only users passing PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW or equivalent can view Overview and run actions.
- POST/GET import/export/diagnostics endpoints must check session/auth server-side (NextAuth) and ensure staff role.
- Limit export content to non-sensitive values — do not include secrets in exports.

Accessibility
- Buttons and interactive controls must be keyboard-focusable and have ARIA labels.
- Provide clear success/failure toast feedback (sonner used in current UI).
- Use semantic HTML (lists/sections) and ensure color contrast for badges.

Data & Telemetry
- Track action events: settings_export, settings_import, diagnostics_run with user id and outcome.
- Show telemetry links to Sentry and recent errors if available.

Testing
- Unit tests (Vitest) for SettingsOverview rendering in multiple states (healthy, partial, failing).
- Integration tests for quick actions using msw to mock API responses.
- Playwright e2e that runs as admin user and verifies export file download and import success flows.

Acceptance Criteria
- /admin/settings renders the Overview by default for authorized users.
- Run Diagnostics returns and renders results without blocking the UI and shows a toast.
- Export creates a JSON download; Import accepts a valid JSON file and shows success.
- Accessibility: keyboard operable, ARIA attributes present, and colors meet contrast.

Implementation notes & PR checklist
- Reuse existing components and styling tokens; do not create new color variables.
- Add server routes under src/app/api/admin/settings/* and client helpers under src/services.
- Add unit tests in tests/components and integration tests in tests/integration.
- Document new routes and developer notes in docs/admin-settings-enhancement-todo.md and this spec.

Wireframe (ASCII simplified)

+-------------------------------------------------------------+
| Settings Overview                                           |
| [Sidebar: SettingsNavigation]     |  [System Health] [Quick]  |
|                                    [ Recent Changes ]       |
|                                                                 |
| Pinned Settings: [Booking] [Currencies] [Integrations]         |
+-------------------------------------------------------------+

File references
- UI: src/components/admin/settings/SettingsOverview.tsx
- Services: src/services/settings.service.ts
- API: src/app/api/admin/settings/{diagnostics,export,import}/route.ts
- Registry: src/lib/settings/registry.ts

Delivery
- This specification will be used to implement UI, server routes, and tests. The initial implementation should be minimal and safe (no destructive import operations) and can be extended in follow-ups.
