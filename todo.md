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
- [ ] Ensure all settings are schema-driven (Zod + Prisma alignment). Some alignment exists; tighten legalLinks typing.
- [ ] Verify correct persistence strategy: Component → State, User → DB per-user, Tenant → DB per-org, System → env.
- [ ] Expose settings via SettingsContext/Provider (centralize reads and cache per-tenant).
- [ ] Enforce tenant isolation + RBAC for updates (APIs already check permissions).

Notes: Zod schemas exist at `src/schemas/settings/organization.ts`. Good to centralize defaults and provide a server util `getEffectiveOrgSettings(tenantId)` (we have `getEffectiveOrgSettingsFromHeaders`).

### Phase 5 – UI/UX Alignment
- [x] Add success/error feedback on Save (toasts) in all Organization tabs.
- [ ] Move quick toggles into Modal/Popover where appropriate.
- [ ] Move org-wide controls into Dedicated Settings Page (already present).
- [ ] Avoid mixing component-only preferences with org-level policies.

Notes: Added sonner toasts on save for General, Branding, Localization, Legal, and Contact tabs to provide immediate feedback.

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
- Added success and error toast feedback when saving organization settings in the following files:
  - `src/components/admin/settings/groups/Organization/GeneralTab.tsx`
  - `src/components/admin/settings/groups/Organization/BrandingTab.tsx`
  - `src/components/admin/settings/groups/Organization/LocalizationTab.tsx`
  - `src/components/admin/settings/groups/Organization/LegalTab.tsx`
  - `src/components/admin/settings/groups/Organization/ContactTab.tsx`

Why:
- The admin tabs were saving via the API but provided no direct success/error feedback; adding toasts improves UX and signals persistence to the user.

Immediate next steps (recommended, ordered):
1. Manual verification: Save a variety of org settings in the UI, refresh a public page and admin page to confirm values persisted and reflected (focus: name/logo/defaultLocale/contact/legalLinks).
2. Wire legalLinks and contact info into `OptimizedFooter` (already reads props) to show org-level contact in public footer (ensure tenant scoping in `app/layout.tsx`).
3. Harden multi-tenancy: confirm `MULTI_TENANCY_ENABLED` behavior and ensure `getEffectiveOrgSettingsFromHeaders` always uses `tenantFilter`.
4. Implement SettingsContext/Provider to centralize settings for client components and provide a single cache + subscribe mechanism (could reuse `org-settings-updated` localStorage event).
5. Add integration tests in `tests/integration` for: GET/PUT permissions, tenant isolation, footer reflecting org settings.
6. Migrate `branding.legalLinks` schema to explicit object (terms/privacy/refund) and write a safe DB migration to transform existing record-shaped JSON if needed.


---

## Short checklist (what I completed here)
- [x] Code audit: located API routes, schema, and UI usages
- [x] Confirmed Prisma model `OrganizationSettings` exists
- [x] Verified API PUT implements validation & tenant scoping
- [x] Verified UI calls API on Save (service + component wiring)
- [x] Added user-facing toasts for save success/failure in admin tabs
- [x] Updated this `todo.md` with status, reasoning, and next steps


---

## Files touched (for reviewers)
- Modified: `src/components/admin/settings/groups/Organization/GeneralTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/BrandingTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/LocalizationTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/LegalTab.tsx`
- Modified: `src/components/admin/settings/groups/Organization/ContactTab.tsx`


If you want I can:
- Implement the SettingsContext/Provider and wire ClientLayout to use it (recommended next task).
- Wire contact/legal into footer and create tests for persistence and tenant isolation.
- Create a safe migration to normalize `legalLinks` schema and update Zod + Prisma alignment.

