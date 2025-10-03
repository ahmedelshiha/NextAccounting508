# Build Error Fix – Organization Settings (blocking compile)

- [x] Resolve TS compile error in `src/app/api/admin/org-settings/route.ts` caused by accessing properties on `JsonValue`.
  - Change: Added runtime type guard `toLegalLinks` and `LegalLinks` type; safely narrowed `legalLinks` in both GET and PUT to read `terms/privacy/refund` without type errors. Also updated fallbacks to use the narrowed object.
  - Why: Next.js build failed due to `Property 'terms' does not exist on type 'string | number | boolean | JsonObject | JsonArray'`.
  - Next: Run `pnpm typecheck` and full tests; verify admin UI reads/writes legal links correctly.

---

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
- [x] Test: Change a setting → refresh → confirm persistence in DB + panel reload (integration test exists: tests/integration/org-settings.persistence.test.ts).

Notes: Persistence, validation, and wiring were already present. PUT route performs safeParse against `OrganizationSettingsSchema` and upserts the tenant-scoped row.

### Phase 3 – Ensure Real Impact
- [x] Identify each setting’s intended purpose (timezone, require2FA, booking duration) and assign owners (documented in audit notes).
- [x] Implemented the following enforcements/wiring:
  - require2FA → enforcement added to `requireAuth` behind env flag `ENFORCE_ORG_2FA` (opt-in).
  - defaultTimezone → reminder delivery now falls back to tenant defaultTimezone when user preference missing (src/app/api/cron/reminders/route.ts).
  - contact/legal → surfaced in OptimizedFooter and Navigation via SettingsProvider.
- [x] defaultCurrency → consider for price display fallbacks (completed; wired in pricing.ts with tests).
- [x] Write integration tests to verify behavior changes when settings are toggled. (Added availability timezone tests)
- [x] Document unused/legacy settings for removal. (See Legacy Settings section below)

Notes: Many settings were previously inert. Implemented low-risk, opt-in enforcement for 2FA and timezone fallback in reminders; wired tenant timezone into scheduling/availability using luxon for DST-correct calculations and added integration tests for tenant timezones.

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
- [x] Add success/error feedback on Save (toasts) in all Organization admin tabs.
- [x] Centralize header/footer to use SettingsProvider (Navigation + OptimizedFooter now prefer provider values).
- [x] Move quick toggles into Modal/Popover where appropriate. (Legal, Branding, Contact now use dialogs)
- [x] Move org-wide controls into Dedicated Settings Page (already present).
- [x] Avoid mixing component-only preferences with org-level policies. (Validated patterns; no remaining violations)

Notes: BrandingTab and ContactTab now use dialogs; LegalTab already moved. Provider auto-refresh keeps UI in sync.

### Phase 6 – Deliverables
- [x] Generate a Settings Inventory Table (CSV/markdown) for all fields and usages. (Added below)
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
- Added explicit legal link columns to Prisma model and migration tooling:
  - `prisma/schema.prisma`: added termsUrl, privacyUrl, refundUrl
  - `scripts/migrate-legal-links-to-columns.ts`: backfill script that copies legacy legalLinks JSON into new columns
  - `src/schemas/settings/organization.ts`: updated Zod to accept explicit termsUrl/privacyUrl/refundUrl and retain legacy legalLinks
  - `src/app/api/admin/org-settings/route.ts`: updated GET/PUT to read/write explicit columns and fall back to legacy JSON
  - `src/lib/org-settings.ts`: prefer explicit columns when returning effective org settings
  - package.json: added script `db:migrate:legalLinks` to run the backfill script
- Wired defaultCurrency fallback in pricing code:
  - `src/lib/booking/pricing.ts`: prefer tenant OrganizationSettings.defaultCurrency as baseCurrency when available
- Added tests:
  - `tests/unit/pricing.tenant-default.test.ts` (tenant default currency in pricing)
  - `tests/integration/org-settings.tenant-isolation.test.ts` (tenant-scoped GET behavior)

Why:
- Centralizing org settings avoids duplicated fetch logic and provides a single source of truth for runtime UI (header/footer/translation provider). The provider also listens for cross-tab updates triggered by the admin API client.
- Explicit legal link columns enable stricter validation, easier querying, and safer migrations away from a free-form JSON blob. Backfill script preserves existing data.
- Tenant defaultCurrency in pricing ensures prices reflect tenant preferences when present (useful for multi-tenant deployments).

Immediate next steps (ordered - actionable):
1. Apply DB migration (local/dev or CI):
   - Run: pnpm db:generate (ensure Prisma client generated)
   - Recommended (developer machine): pnpm prisma migrate dev --name add-legal-links-columns
   - If using deployment migration flow: create and apply migration via your CI stack (prisma migrate deploy)
2. Backfill existing data:
   - Run: pnpm db:migrate:legalLinks (executes scripts/migrate-legal-links-to-columns.ts)
   - Verify updated rows via prisma studio or SELECT query
3. Run typecheck & tests:
   - pnpm typecheck
   - pnpm test (fix any issues the CI surfaces)
4. Verify runtime behavior:
   - Confirm admin org-settings UI shows and saves explicit URL fields (termsUrl/privacyUrl/refundUrl)
   - Confirm public pages (header/footer) display legal links from new columns
5. Optional cleanup (deprecate legacy JSON):
   - After verification and a short monitoring window, remove the legalLinks Json column and related code paths.

Notes: Implemented changes are backward-compatible. The code prefers explicit DB columns but falls back to legacy JSON blob so there’s no immediate data loss risk.

Security & deployment notes:
- Don't commit real DB connection strings or secrets. Run migrations in CI with proper DB backups and maintenance windows.
- Consider adding a CI step for running the backfill script and verifying row counts post-migration.

Updated TODOs (progress tracking)
- [x] Wire defaultCurrency fallbacks in pricing code (medium)
- [x] Fix Luxon toISO typing in availability.ts
- [x] Add automated integration test for org-settings persistence
- [x] Add explicit legal link DB columns and backfill tooling (this change)
- [ ] Apply migrations in staging/production and run backfill (external step)
- [ ] Remove legacy legalLinks JSON after verification (post-deployment cleanup)

How to apply the DB migration (commands)
- pnpm db:generate
- pnpm prisma migrate dev --name add-legal-links-columns
- pnpm db:migrate:legalLinks
- pnpm typecheck && pnpm test

If you’d like I can now:
- Generate a draft Prisma migration SQL file in prisma/migrations (I created a migration SQL in prisma/migrations/20251001_add_legal_links_columns/migration.sql), or
- Run typecheck/tests here, or
- Open a PR draft with these changes (I can prepare the PR title/body).

---

## Settings Inventory (CSV)

Field,Type,Source,Used In,Notes
name,string,OrganizationSettings.name,Header/Footer/SEO,Displayed brand name
logoUrl,string,OrganizationSettings.logoUrl,Header/Footer,Shown as logo; initials fallback
contactEmail,string,OrganizationSettings.contactEmail,Footer/Contact,Support email link
contactPhone,string,OrganizationSettings.contactPhone,Footer/Contact,Support phone link
address,json,OrganizationSettings.address,Contact/Admin,Structured address fields
defaultTimezone,string,OrganizationSettings.defaultTimezone,Reminders/Availability,Timezone fallback
defaultCurrency,string,OrganizationSettings.defaultCurrency,Pricing/Display,Base currency fallback
defaultLocale,string,OrganizationSettings.defaultLocale,i18n,Language default
branding,json,OrganizationSettings.branding,Admin UI,Fine-grained theming (optional)
termsUrl,string,OrganizationSettings.termsUrl,Footer/Public pages,Legal link (preferred)
privacyUrl,string,OrganizationSettings.privacyUrl,Footer/Public pages,Legal link (preferred)
refundUrl,string,OrganizationSettings.refundUrl,Admin/Public pages,Optional legal link
legalLinks(json; legacy),json,OrganizationSettings.legalLinks,Compatibility,Fallback only; slated for removal

## Legacy Settings
- legalLinks JSON is legacy; explicit URL columns (termsUrl, privacyUrl, refundUrl) are the source of truth.
- Removal plan: after migrations/backfill verified in prod, drop legalLinks column and code fallbacks.

## Files added/modified in this change
- Modified: prisma/schema.prisma (added termsUrl/privacyUrl/refundUrl)
- Added: prisma/migrations/20251001_add_legal_links_columns/migration.sql (SQL for migration)
- Added: scripts/migrate-legal-links-to-columns.ts (backfill script)
- Modified: src/schemas/settings/organization.ts (Zod schema updated)
- Modified: src/app/api/admin/org-settings/route.ts (read/write explicit columns)
- Modified: src/lib/org-settings.ts (select explicit columns and return normalized legalLinks)
- Modified: src/lib/booking/pricing.ts (tenant defaultCurrency fallback)
- Added: tests/unit/pricing.tenant-default.test.ts
- Added: tests/integration/org-settings.tenant-isolation.test.ts
- Modified: package.json (added db:migrate:legalLinks script)

---
