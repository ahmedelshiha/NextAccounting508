## ✅ Completed (append)
- [x] Consolidated cron reminders into src/lib/cron/reminders.ts and refactored API + Netlify function to depend on it
  - **Why**: remove logic drift across entry points
  - **Impact**: single source of truth for reminder processing; Netlify function falls back to shared runner when origin absent

## ✅ Completed (append)
- [x] Fixed build errors in health endpoints by importing NextRequest/NextResponse and documenting handlers
  - **Why**: unblock CI/build; standardize API handler typings
  - **Impact**: vercel:build passes type checks for health routes; safer edge/node compatibility
- [x] Ensured API health routes use shared utilities from src/lib/health.ts
  - **Why**: eliminate duplicate health logic
  - **Impact**: single source of truth for health payloads; easier future changes

## ✅ Completed
- [x] Remove duplicate route: `/api/auth/register/register` → redirect to `/api/auth/register`
  - **Why**: preserve backward compatibility for older clients while consolidating registration logic
  - **Impact**: single canonical registration endpoint (`/api/auth/register`); legacy path now issues 307 redirects; reduces surface area for future drift
  - **Verification**: grep shows both paths exist but nested path only performs redirect; internal callers use canonical endpoint

## ⚠️ Issues / Risks
- redundancy-report.md not found in repository; proceeding with consolidation based on existing code and objectives. Provide or restore this file for full directive traceability.
- DATABASE_URL vs NETLIFY_DATABASE_URL dual support exists in src/lib/health.ts; pending unification to canonical DATABASE_URL across app and functions.

## 🚧 Tasks
- [ ] Remove duplicate route: /auth/register → redirect to /api/auth/register
  - Description: Replace any duplicate page routes with a redirect to the canonical API route
  - Prerequisites: Inventory existing auth routes and preview-login logic
  - Expected output: Single registration flow with server-side redirect
  - Verification criteria: Grep shows only one implementation; e2e auth still passes
- [ ] Merge usePerformanceMonitoring across /hooks and /components
  - Description: Consolidate duplicated hook logic into src/hooks/usePerformanceMonitoring.ts
  - Prerequisites: Identify duplicates in hooks/admin and components/admin
  - Expected output: Single exported hook with tests
  - Verification criteria: All imports updated; app compiles; tests pass
- [ ] Refactor SettingsNavigation → shared component under /components/common/
  - Description: Move/merge duplicates, keep styles and props stable
  - Prerequisites: Compare components/admin/settings/SettingsNavigation and any duplicates
  - Expected output: Single reusable component
  - Verification criteria: UI unchanged; stories/tests green
- [ ] Consolidate cron logic under src/lib/cron/scheduler.ts
  - Description: Extract scheduler and task runners used by Netlify and API
  - Prerequisites: Inventory cron Netlify functions and API routes
  - Expected output: Shared scheduler with unit tests
  - Verification criteria: Cron endpoints/functions import shared code only
- [ ] Update Prisma env reference → canonical DATABASE_URL
  - Description: Standardize env usage (Netlify/Neon) to DATABASE_URL with adapter logic
  - Prerequisites: Audit prisma.config.ts, lib/db, Netlify env mapping
  - Expected output: Single env variable with compatibility shim
  - Verification criteria: Local, Netlify, Vercel all connect via DATABASE_URL
- [ ] Add CI check for duplicate routes or components
  - Description: Script to detect duplicate filenames and dev-only exports
  - Prerequisites: Decide patterns to flag
  - Expected output: CI step failing on duplication
  - Verification criteria: Intentional duplicates are ignored via allowlist

## 🚧 In Progress
- [ ] Plan env unification to DATABASE_URL and remove drift

## 🔧 Next Steps
- [ ] Audit auth/register callers across services and tests to replace any remaining usage of `/api/auth/register/register` with `/api/auth/register` where safe
- [ ] Add CI check to flag nested or duplicate API routes under `src/app/api/**/` to prevent regressions
- [ ] Locate and merge duplicate usePerformanceMonitoring
- [ ] Unify SettingsNavigation component location and API
- [ ] Introduce src/lib/cron/scheduler.ts and migrate call sites
