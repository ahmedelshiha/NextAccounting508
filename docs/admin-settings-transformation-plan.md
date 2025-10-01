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

## System tab — full inventory (items to migrate)
The AdminSidebar `system` section currently contains the following items and subpages (source: src/components/admin/layout/AdminSidebar.tsx):

- Settings (/admin/settings)
  - Children come from SETTINGS_REGISTRY and typically include: General, Booking Settings, Currencies, Financial, Communication, Tasks, etc.
- Users & Permissions (/admin/users)
  - Users (/admin/users)
  - Roles (/admin/roles)
  - Permissions (/admin/permissions)
- Security (/admin/security)
  - Security Center (/admin/security)
  - Audits (/admin/audits)
  - Compliance (/admin/compliance)
- Uploads (/admin/uploads)
  - Quarantine (/admin/uploads/quarantine)
- Cron Telemetry (/admin/cron-telemetry)
- Integrations (/admin/integrations)

All of these must be discoverable and manageable from the unified Settings surface. Some settings pages are already under /admin/settings/*; others (users, roles, permissions, security, audits, integrations) need to be surfaced inside the settings navigation and routed under /admin/settings where appropriate, or linked prominently from within settings.

## High-level design
1. Canonical registry: Ensure src/lib/settings/registry exports a complete list of setting modules with metadata: { key, label, route, icon, permission, order, group } and includes mappings for Users & Permissions, Security, Uploads, Cron Telemetry, Integrations, etc.
2. Single settings layout: Create or extend a SettingsShell component used on /admin/settings and nested routes. Responsibilities:
   - Render SettingsNavigation (left) — driven by registry and permission checks.
   - Render header (title, breadcrumbs, quick actions) and main content area.
   - Provide contextual helpers (Save/Reset), and a consistent modal/import/export experience.
3. Route consolidation: Move or alias system routes to live under /admin/settings where appropriate. Example mapping:
   - /admin/settings (General)
   - /admin/settings/booking (Booking Settings)
   - /admin/settings/currencies (Currencies)
   - /admin/settings/users (Users & Permissions – wrapper linking Users/Roles/Permissions)
   - /admin/settings/security (Security Center, Audits, Compliance)
   - /admin/settings/integrations (Integrations)
   - /admin/settings/uploads (Uploads / Quarantine)
   - /admin/settings/cron (Cron Telemetry)
   Keep legacy top-level routes as redirects or thin wrappers where necessary to preserve external links.
4. Centralize permissions and audit logging:
   - Continue using PermissionGate but add a helper that wraps settings pages to emit audit events on save/update.
5. UI/UX:
   - Left nav: grouped list of settings (General, Platform, Security, Integrations) with badges and ordering defined by registry.
   - Main: responsive grid of cards on top-level /admin/settings for overview and quick access.
   - Each settings page: consistent header, Save/Reset controls, Import/Export controls (when supported), and inline help.

## Migration plan (detailed)
For each system item below, the plan shows target route, acceptance criteria and implementation notes.

1) Settings (registry-driven)
- Target: /admin/settings and /admin/settings/* for children
- Acceptance: All registry entries appear in SettingsNavigation and their pages render inside SettingsShell.
- Notes: Normalize registry entries with group/order metadata; lazy-load heavy pages.

2) Users & Permissions
- Target: /admin/settings/users (landing) with links or nested child routes for users/roles/permissions (/admin/settings/users/list, /admin/settings/users/roles, /admin/settings/users/permissions)
- Acceptance: Existing user management pages are reachable under settings; permission checks remain enforced (PERMISSIONS.USERS_VIEW, USERS_MANAGE).
- Notes: Prefer thin wrapper pages referencing existing implementations under src/app/admin/users/* to avoid duplication. Add redirects from /admin/users -> /admin/settings/users.

3) Security
- Target: /admin/settings/security with nested tabs or subsections for Security Center, Audits, Compliance.
- Acceptance: Security workflows (audit logs, compliance pages) render inside SettingsShell; audit & monitoring hooks enabled.
- Notes: Keep audit logs route and ensure retention and RBAC checks unchanged.

4) Uploads
- Target: /admin/settings/uploads and /admin/settings/uploads/quarantine
- Acceptance: Upload quarantine page appears under settings and functionality unchanged.
- Notes: Ensure file upload/Post handlers and quarantine client remain accessible.

5) Cron Telemetry
- Target: /admin/settings/cron or /admin/settings/telemetry
- Acceptance: Cron telemetry dashboard accessible from settings and preserves read permissions.

6) Integrations
- Target: /admin/settings/integrations
- Acceptance: Integrations page(s) show under settings and maintain existing test/run capabilities; connections remain intact.

7) Backwards compatibility
- For any moved top-level route (e.g., /admin/users, /admin/security, /admin/integrations), provide thin redirect pages that perform a 1:1 internal redirect (Next.js redirect or client-side router push) to new /admin/settings route to avoid breaking links.

## Implementation plan (step-by-step)
1. Audit & normalize SETTINGS_REGISTRY; add missing system items (Users, Security, Uploads, Cron, Integrations) with group/order and permission metadata.
2. Create SettingsShell: src/components/admin/settings/SettingsShell.tsx and app-level layout: src/app/admin/settings/layout.tsx to wrap nested settings pages.
3. Update SettingsNavigation to support groups, ordering and expanded/collapsed behavior.
4. Create thin redirect pages for legacy system routes (e.g., src/app/admin/users/page.tsx -> redirect to /admin/settings/users).
5. Migrate or wrap existing pages to mount under /admin/settings. Start with Booking as POC, then migrate Users & Permissions, Security, Integrations, Uploads, Cron.
6. Add audit logging and Sentry integration to settings save/update handlers.
7. Test, QA and rollout behind feature flag.

## Files to create/update (concrete)
- src/lib/settings/registry.ts — normalize and include all system items
- src/components/admin/settings/SettingsShell.tsx
- src/app/admin/settings/layout.tsx
- src/components/admin/SettingsNavigation.tsx — ensure support for groups/order
- Redirect wrappers under src/app/admin/* for legacy system routes
- Migrate/wrap existing pages under src/app/admin/settings/*

## Permission & Data migration considerations
- Permissions remain enforced via PermissionGate. Use centralized PERMISSIONS constants.
- No DB schema changes required for UI migration; if centralizing persisted settings, plan a separate migration for a `settings` store/table.

## QA & Testing plan
- Unit tests for registry mapping and SettingsNavigation permission filtering.
- Integration tests for navigation flows and sample save flow.
- E2E tests for critical path: /admin/settings -> open Booking -> save -> audit event.

## Rollout & monitoring
- Feature flagged rollout, monitor Sentry and usage telemetry, keep redirects for at least 30 days.

## Risks & mitigation
- Bookmarks/external links: mitigate via redirects.
- Permissions regressions: mitigate via RBAC tests and review.
- Bundle size: mitigate via lazy-loading.

## Timeline (example)
- Discovery & registry normalization: 2 days
- SettingsShell & layout: 2 days
- Page migration (full system tab): 7 days
- Testing & rollout: 3 days
- Total (approx): 14 days (1 developer)

## Concrete next steps (actionable)
1. Audit SETTINGS_REGISTRY and add `group`/`order` fields; ensure it contains mappings for Users, Security, Uploads, Cron, Integrations.
2. Implement src/app/admin/settings/layout.tsx and src/components/admin/settings/SettingsShell.tsx.
3. Migrate Booking settings as a POC and then migrate remaining system items in small batches.
4. Add redirects for legacy system routes.
5. Consolidate Users & Permissions last and ensure thorough RBAC testing.

## Recommended MCP integrations (available in Builder.io)
Include all recommended MCPs and how they help the migration and rollout:
- Builder.io (CMS & content): use for help content and settings documentation — [Open MCP popover](#open-mcp-popover).
- Neon (serverless Postgres): for a dedicated settings database or feature flags — [Connect to Neon](#open-mcp-popover).
- Netlify (hosting & deployment): use Netlify for deployment automation — [Connect to Netlify](#open-mcp-popover).
- Zapier (automation): trigger notifications or workflows when settings change — [Connect to Zapier](#open-mcp-popover).
- Figma (design -> code): import designs via the Builder.io Figma plugin — get plugin via MCP Servers or the plugin URL.
- Supabase (auth & DB): alternative storage/auth option; useful for quick prototyping — [Connect to Supabase](#open-mcp-popover).
- Sentry (error monitoring): capture errors during migration/rollout — [Connect to Sentry](#open-mcp-popover).
- Linear (issue tracking): track migration tasks & bugs — [Connect to Linear](#open-mcp-popover).
- Notion (docs): publish runbooks & migration notes — [Connect to Notion](#open-mcp-popover).
- Context7 (docs lookup): use for library docs and references — [Connect to Context7](#open-mcp-popover).
- Semgrep (security scanning): run SAST checks on new code — [Connect to Semgrep](#open-mcp-popover).
- Prisma Postgres (ORM): help validate DB schema and migrations if needed — [Connect to Prisma](#open-mcp-popover).

## Acceptance criteria
- All system-level pages reachable under /admin/settings with consistent left navigation.
- No broken routes; legacy routes redirect or 1:1 map.
- Permission model unchanged and enforced via PermissionGate.
- Visual and interaction parity preserved; design tokens and CSS variables not altered.
- Tests covering navigation, permission gating and a sample save flow are added.

---

If you want, I can begin by normalizing SETTINGS_REGISTRY and creating the SettingsShell and layout, then migrate Booking settings as a proof-of-concept. Say "Start migration" to begin implementation or specify which system items I should prioritize first.
