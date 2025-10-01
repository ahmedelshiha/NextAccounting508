# Admin Dashboard — Unified Settings Panel Transformation Plan

## Executive summary
Unify all "System" related features currently scattered across the Admin Sidebar (Settings, Users & Permissions, Security, Cron Telemetry, Integrations, Uploads, etc.) into a single, cohesive Settings area under /admin/settings. This will improve discoverability, reduce cognitive overhead, centralize permission checks, and make future feature additions easier.

Goals:
- Consolidate system-level pages (settings, users & permissions, security, cron, integrations, uploads) into a single Settings area with a persistent SettingsShell and navigation.
- Reuse existing SETTINGS_REGISTRY as the canonical source-of-truth for settings pages.
- Provide a modern, extensible Settings layout (left navigation, main content area with cards, modals and nested routes).
- Centralize authorization and audit hooks so permission logic is consistent and easily testable.

## Current state (summary of repository analysis)
Key files inspected:
- src/components/admin/layout/AdminSidebar.tsx (sidebar sections incl. `system`)
- src/components/admin/SettingsNavigation.tsx (settings side navigation driven by SETTINGS_REGISTRY)
- src/components/admin/BookingSettingsPanel.tsx and src/app/admin/settings/* pages
- src/components/PermissionGate.tsx (authorization wrapper)
- SETTINGS_REGISTRY (src/lib/settings/registry) — used to define settings items

Observations:
- The Admin Sidebar already groups system pages under a `system` section and builds a children array from SETTINGS_REGISTRY.
- There is an existing SettingsNavigation component and SETTINGS_REGISTRY which already provide programmatic settings discovery and permission gating.
- Multiple settings pages and panels exist separately (booking, financial, communication, etc.). Some pages (Users & Permissions, Security) still live outside the main /admin/settings route hierarchy.
- Permission checks are done via PermissionGate component; SETTINGS_REGISTRY entries include permissions, routes and icons.

Conclusion: foundational pieces exist (registry, navigation, permission wrapper); the task is to consolidate, re-route, and standardize the UI and behavior.

## High-level design
1. Canonical registry: Ensure src/lib/settings/registry exports a complete list of setting modules with metadata: { key, label, route, icon, permission, order, group }. This becomes the single source-of-truth.
2. Single settings layout: Create or extend a SettingsShell component (or SettingsLayout) used on /admin/settings and all nested settings routes. Responsibilities:
   - Render SettingsNavigation (left) — driven by registry and permission checks.
   - Render a header (title, breadcrumbs, quick actions) and main content area.
   - Provide contextual helpers (Save/Reset), and a consistent modal/import/export experience.
3. Route consolidation: Move or alias system routes to live under /admin/settings where appropriate. Example:
   - /admin/settings (General)
   - /admin/settings/booking
   - /admin/settings/users (Users & Permissions)
   - /admin/settings/security
   - /admin/settings/integrations
   - /admin/settings/uploads
   Keep legacy top-level routes as redirects or thin wrappers where necessary (to preserve external links/backwards compatibility).
4. Centralize permissions and audit logging:
   - Continue using PermissionGate but add a lightweight HOC/helper for settings pages to automatically wrap page components and emit audit events when a settings change is saved.
5. UI/UX
   - Left nav: vertical list of registry items with grouping (General, Booking, Financial, Integrations, Security, Platform).
   - Main: responsive grid of cards on top-level /admin/settings for settings overview and quick links.
   - Each settings page: consistent header, Save/Reset controls, Import/Export controls (when supported), and inline help.

## Implementation plan (step-by-step)
Priorities and estimated effort (small-medium-large):

1) Preparation (small — 1-2 dev days)
- Audit and normalize src/lib/settings/registry: ensure every settings page is registered with a unique key, route under /admin/settings, label, icon, and permission.
- Add `group` and `order` metadata to registry entries to allow grouping and ordering in the nav.

2) Create SettingsShell / Layout (small — 1-2 dev days)
- File: src/components/admin/settings/SettingsShell.tsx (or extend existing SettingsShell if present).
- Responsibilities: render SettingsNavigation, content container, consistent header, and common modals (Import/Export/Reset).
- Ensure server and client rendering boundaries are correct (use client directive where needed).

3) Migrate pages to nested routes (medium — 2-4 dev days)
- Move or create wrappers for pages so they mount under /admin/settings/* using Next's nested routing (app directory):
  - src/app/admin/settings/layout.tsx (wraps children with SettingsShell)
  - For each settings page, ensure route path matches registry.route.
- Create thin redirect pages for legacy locations if any important routes are used externally.

4) Consolidate Users & Permissions into settings (medium — 3-5 dev days)
- Move or import user management pages (src/app/admin/users/*) under src/app/admin/settings/users/* or provide a strong link in the settings nav.
- Update Permission checks: roles and permission management tools should be accessible only when current user has PERMISSIONS.USERS_MANAGE, etc.
- Consider adding an admin-only feature flag during rollout.

5) Security & Auditing integration (medium — 3 dev days)
- Wrap settings save/update actions with audit logging (src/lib/audit.ts) to record who changed what.
- Integrate with Sentry for error capture in settings flows.

6) Integrations & Cron pages (small — 1-2 dev days)
- Move integrations and cron pages into settings, or add them as secondary registry items under the Integrations group, ensuring permissions remain intact.

7) Testing (small — 2-3 dev days)
- Unit tests for SettingsNavigation, SettingsShell, permission gating and registry transformation.
- Integration/e2e tests for basic flows (navigating settings, saving, import/export).

8) Documentation & Rollout (small — 1-2 dev days)
- Update README/Docs: add migration notes, how to register a new settings page, and how to add permissions.
- Rollout strategy: beta flag, gradual rollout and monitoring.

## Files to create/update (concrete)
- Add/ensure registry: src/lib/settings/registry.ts (normalize keys)
- New layout: src/app/admin/settings/layout.tsx -> wraps children with SettingsShell
- New component: src/components/admin/settings/SettingsShell.tsx
- Update existing nav: src/components/admin/SettingsNavigation.tsx (already exists — ensure it reads new `group` & `order`) 
- Update AdminSidebar.tsx to keep a single link to /admin/settings; ensure children are curated via registry (already wired)
- Update: settings pages under src/app/admin/settings/* to conform to new layout (header, save handlers)
- Migrate or alias: src/app/admin/users -> src/app/admin/settings/users (or thin redirect)

## Developer-level implementation notes
- Use SETTINGS_REGISTRY as authoritative and ensure imports are static where possible to enable tree-shaking. For heavier settings that are rarely used, use dynamic import() to code-split.
- Keep PermissionGate and use it consistently: wrap entire settings layout and also critical actions (save/export/import) with an additional permission check.
- Preserve existing CSS variables and Tailwind classes. Don’t alter color variables or break existing media queries.
- When moving pages, add a simple redirect route file in the old location to avoid breaking bookmarks and external links — a 1:1 redirect to new nesting.
- Preserve URLs where possible: prefer moving UI surface without changing public route if required; otherwise add redirects.

## Permission & Data migration considerations
- Permissions: Consolidation doesn’t change permissions semantics, but you must ensure registry entries include correct PERMISSIONS.* values. Use centralized permission constants from src/lib/permissions.
- Data: No DB schema changes necessarily required. If moving to central settings model (persisted setting items), consider adding a `settings` table or using existing settings storage; scope this separately.

## QA & Testing plan
- Unit tests for: registry mapping, SettingsNavigation, SettingsShell rendering and permission filtering.
- Integration tests: navigation flows, create/update flows for a sample settings page (booking settings), export/import roundtrip.
- E2E: critical path: visit /admin/settings -> open Booking -> save changes -> verify audit log and UI toast.

## Rollout & monitoring
- Release behind a feature flag (config: `FEATURE_UNIFIED_SETTINGS=true`).
- Monitor: Sentry errors, usage telemetry (how often users click moved links), and user feedback.
- Keep redirects for at least 30 days; log broken/404 hits to find missed links.

## Risks & mitigation
- Risk: Broken bookmarks and external links. Mitigation: add redirects and deprecation notice.
- Risk: Permission regressions. Mitigation: tight unit tests, code review and RBAC tests.
- Risk: Large settings pages may increase bundle size. Mitigation: lazy-load heavy editors.

## Timeline (example)
- Discovery & registry normalization: 2 days
- SettingsShell & layout: 2 days
- Page migration (booking/financial/communication): 4 days
- Users & Security consolidation: 5 days
- Testing & rollout: 3 days
- Total (approx): 16 days (1 developer)

## Concrete next steps (actionable)
1. Audit SETTINGS_REGISTRY and add `group`/`order` fields.
2. Implement src/app/admin/settings/layout.tsx and src/components/admin/settings/SettingsShell.tsx.
3. Migrate a single page (Booking) into the new layout and validate flows + tests.
4. Migrate remaining pages in small batches, adding redirects for legacy routes.
5. Consolidate Users & Permissions last and ensure thorough RBAC testing.

## Recommended MCP integrations (available in Builder.io)
These MCP integrations are recommended for various parts of the plan — include all available MCP servers as requested:

- Builder.io (CMS & content): Use for help content, settings documentation pages, and marketing landing management. Connect via [Open MCP popover](#open-mcp-popover) — Connect to Builder.io.
- Neon (serverless Postgres): Useful if you need a dedicated database for settings or feature flags. Connect via [Connect to Neon](#open-mcp-popover).
- Netlify (hosting & deployment): If deploying there, use Netlify for CDN and deployment automation — [Connect to Netlify](#open-mcp-popover).
- Zapier (automation): Good for automating notifications when settings change or for integration workflows — [Connect to Zapier](#open-mcp-popover).
- Figma (design -> code): Use Builder.io Figma plugin to import design iterations for the Settings UI. Get plugin from the MCP Servers section or at the plugin URL: https://www.figma.com/community/plugin/747985167520967365/builder-io-ai-powered-figma-to-code-react-vue-tailwind-more
- Supabase (auth & DB): Alternative to Neon for auth/DB; useful if you prefer an all-in-one backend — [Connect to Supabase](#open-mcp-popover).
- Sentry (error monitoring): Integrate to capture issues during rollout — [Connect to Sentry](#open-mcp-popover).
- Linear (issue tracking): Track migration tasks and bugs during the rollout — [Connect to Linear](#open-mcp-popover).
- Notion (docs): Publish migration docs/runbook to the team workspace — [Connect to Notion](#open-mcp-popover).
- Context7 (docs lookup): Use for up-to-date library docs and technical reference while implementing changes — [Connect to Context7](#open-mcp-popover).
- Semgrep (security scanning): Run SAST checks on new code to avoid regressions — [Connect to Semgrep](#open-mcp-popover).
- Prisma Postgres (ORM): If you manage schema migrations with Prisma, use this to validate DB changes — [Connect to Prisma](#open-mcp-popover).

## Acceptance criteria
- All system-level pages reachable under /admin/settings with consistent left navigation.
- No broken routes; legacy routes redirect or 1:1 map.
- Permission model unchanged and enforced via PermissionGate.
- Visual and interaction parity preserved; design tokens and CSS variables not altered.
- Tests covering navigation, permission gating and a sample save flow are added.

---

If you want, I can:
- Start implementing the SettingsShell and layout and migrate the Booking settings page as the first PR.
- Create the registry audit changes in a branch and open a draft PR.

Tell me which step you'd like me to begin with, or say "Start migration" to begin implementing the SettingsShell and migrate Booking settings as a proof-of-concept.
