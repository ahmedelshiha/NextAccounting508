# Organization Settings Audit & Fix TODO

This file is a dependency-ordered TODO list, status, and a short fix report.

## Dependency-ordered TODOs

### Phase 1 – Diagnose Current Issue (UI → API → DB → Impact Chain)
- [x] Inspect Organization Settings panel to confirm if “Save” triggers an API request.
- [x] Check code (service and components) to verify `/api/admin/org-settings` is called.
- [x] Trace API route to confirm it writes to DB (`OrganizationSettings` model).
- [x] Inspect DB schema → confirm settings stored (prisma/schema.prisma has OrganizationSettings).
- [x] Search codebase for usages of these settings (services, middleware, UI logic).

Notes: Completed via code audit. API route exists at `src/app/api/admin/org-settings/route.ts`, Prisma model in `prisma/schema.prisma`, UI components call `getOrgSettings`/`updateOrgSettings` in `src/components/admin/settings/groups/Organization/*`.

### Phase 2 – Implement Proper Persistence
- [x] Create/update `OrganizationSettings` model in Prisma (or ORM) with JSON field or structured columns.
- [x] Implement `PUT /api/admin/org-settings` route with:
  - Schema validation (Zod)
  - Tenant scoping (`getTenantFromRequest` + `tenantFilter`)
  - Error handling & defaults
- [x] Wire settings panel `onSave` → call this API (`src/services/org-settings.service.ts`).
- [x] Preload saved settings on component mount (`useEffect` in tabs).
- [ ] Test: Change a setting → refresh → confirm persistence in DB + panel reload (manual or integration test).

Notes: Persistence, validation, and wiring were already present. PUT route performs safeParse against `OrganizationSettingsSchema` and upserts the tenant-scoped row.

### Phase 3 – Ensure Real Impact
- [ ] Identify each setting’s intended purpose (timezone, require2FA, booking duration) and assign owners.
- [ ] For each setting, confirm code references it; implement missing usages (examples below).
  - require2FA → integrate into auth middleware
  - defaultTimezone → apply in scheduling/availability services
  - defaultCurrency → consider for price display fallbacks
  - legalLinks/contact → surface in site footer
- [ ] Write integration tests to verify behavior changes when settings are toggled.
- [ ] Document unused/legacy settings for removal.

Notes: Audit found many settings are stored but unused at runtime (tagline, description, contact.* are admin-only). Action: wire contact/legal into footer (see OptimizedFooter) and schedule larger enforcement work.

### Phase 4 – Standards Compliance (Modern Settings Architecture)
- [x] Ensure all settings are schema-driven (Zod + Prisma alignment). Some alignment exists; tighten legalLinks typing.
- [x] Verify correct persistence strategy: Component → State, User → DB per-user, Tenant → DB per-org, System → env.
- [x] Expose settings via SettingsContext/Provider (centralize reads and cache per-tenant).
- [x] Enforce tenant isolation + RBAC for updates (APIs already check permissions).

Notes: Implemented a client-side SettingsProvider and hook to centralize org settings:
- Added: `src/components/providers/SettingsProvider.tsx` (provides useOrgSettings hook)
- Updated: `src/components/providers/client-layout.tsx` to consume centralized settings
- Updated: `src/app/layout.tsx` to wrap ClientLayout with SettingsProvider and pass initial settings

Behavior: Provider hydrates from server props when available, fetches `/api/public/org-settings` otherwise, and listens for `org-settings-updated` (custom event) and localStorage key `org-settings-updated` to refresh automatically after admin saves.

### Phase 5 – UI/UX Alignment
- [x] Add success/error feedback on Save (toasts) in all Organization tabs.
- [x] Centralize header/footer to use SettingsProvider (Navigation + OptimizedFooter now prefer provider values).
- [ ] Move quick toggles into Modal/Popover where appropriate.
- [ ] Move org-wide controls into Dedicated Settings Page (already present).
- [ ] Avoid mixing component-only preferences with org-level policies.

Notes: Navigation and OptimizedFooter now read from SettingsProvider when available; they still accept props for SSR hydration/fallback.

### Phase 6 – Deliverables
- [ ] Generate a Settings Inventory Table (CSV/markdown) for all fields and usages.
- [x] Provide a Fix Report (this file contains a summary and next steps).
- [x] Update `todo.md` with completed work, reasons, and next steps.


---

## Fix Report (summary of code changes performed during this session)

What I checked and why:
- Verified API endpoints for organization settings (`GET`, `PUT`, `export`, `import`) exist and are tenant-scoped with RBAC.
- Confirmed Prisma model `OrganizationSettings` exists and maps fields used by the UI.
- Confirmed admin UI tabs call `getOrgSettings` and `updateOrgSettings` (client service uses `/api/admin/org-settings`).

What I changed (this commit):
- Added SettingsContext/Provider and hook:
  - `src/components/providers/SettingsProvider.tsx` (SettingsProvider, useOrgSettings)
- Wired provider into server layout:
  - `src/app/layout.tsx` now wraps ClientLayout with SettingsProvider and passes initial settings
- Centralized client consumption:
  - `src/components/providers/client-layout.tsx` now consumes useOrgSettings and updates UI chrome from provider
- Centralized header/footer consumption:
  - `src/components/ui/navigation.tsx` now prefers provider values when available
  - `src/components/ui/optimized-footer.tsx` now prefers provider values when available
- Added sonner toasts for save success/failure in Organization admin tabs.

Files changed/added:
- Added: `src/components/providers/SettingsProvider.tsx`
- Modified: `src/app/layout.tsx`
- Modified: `src/components/providers/client-layout.tsx`
- Modified: `src/components/ui/navigation.tsx`
- Modified: `src/components/ui/optimized-footer.tsx`
- Modified: `src/components/admin/settings/groups/Organization/GeneralTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/BrandingTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/LocalizationTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/LegalTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/ContactTab.tsx`

Why:
- Centralizing org settings avoids duplicated fetch logic and provides a single source of truth for runtime UI (header/footer/translation provider). The provider also listens for cross-tab updates triggered by the admin API client.

Immediate next steps (recommended, ordered):
1. Manual verification: Save org settings in admin UI, then refresh public pages to confirm footer and header reflect changes.
2. Replace direct prop-based org settings consumption in other components (any components still accepting org props) with useOrgSettings for consistency.
3. Add tests: integration tests for provider hydration, cross-tab update propagation, and tenant isolation.
4. Tighten the legalLinks schema and create a migration if necessary.
5. Consider caching provider data (edge/memoization) for public pages that are cold.


---

## Short checklist (what I completed here)
- [x] Code audit: located API routes, schema, and UI usages
- [x] Confirmed Prisma model `OrganizationSettings` exists
- [x] Verified API PUT implements validation & tenant scoping
- [x] Verified UI calls API on Save (service + component wiring)
- [x] Added user-facing toasts for save success/failure in admin tabs
- [x] Implemented SettingsProvider and useOrgSettings
- [x] Centralized ClientLayout to consume provider
- [x] Centralized Navigation and OptimizedFooter consumption
- [x] Updated this `todo.md` with status, reasoning, and next steps


---

## Files touched (for reviewers)
- Added: `src/components/providers/SettingsProvider.tsx`
- Modified: `src/app/layout.tsx`
- Modified: `src/components/providers/client-layout.tsx`
- Modified: `src/components/ui/navigation.tsx`
- Modified: `src/components/ui/optimized-footer.tsx`
- Modified: `src/components/admin/settings/groups/Organization/GeneralTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/BrandingTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/LocalizationTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/LegalTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/ContactTab.tsx`

If you want I can:
- Replace any remaining prop-based org settings usages in other components (search and replace).
- Add integration tests for provider hydration and cross-tab update propagation.
- Implement safe migration for legalLinks schema changes.

