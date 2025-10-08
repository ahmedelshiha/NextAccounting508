## ✅ Completed (append)
- [x] Created allowlist for CI duplicate route checker: scripts/ci/duplicates.allowlist.json
  - **Why**: preserve intentional legacy compatibility endpoints while enforcing new duplicates rule
  - **Impact**: existing legacy redirect `/api/auth/register/register` is explicitly allowlisted; unintentional nested duplicates will still fail CI

## ✅ Completed (append)
- [x] Added CI duplicate API route checker and package.json script
  - **Why**: prevent reintroduction of nested or duplicate API endpoints
  - **Impact**: CI can now fail early when nested duplicate segments exist under src/app/api
  - **How to run locally**: pnpm run check:duplicates

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

## ✅ Completed
- [x] Merge usePerformanceMonitoring across /hooks and /components
  - **Why**: eliminate duplicate implementations and provide a single hook for performance monitoring across admin UI
  - **Impact**: single canonical hook at `src/hooks/usePerformanceMonitoring.ts`; updated imports across components to use new path; legacy implementation removed
  - **Verification**: no imports reference `@/hooks/admin/usePerformanceMonitoring`; consolidated hook file present and components consuming it
  - **Next**: run pnpm typecheck and tests to ensure no regressions

## 🔄 In Progress
- [ ] Running pnpm typecheck and pnpm test to validate refactor (started)

## ⚠️ Issues / Risks
- redundancy-report.md not found in repository; proceeding with consolidation based on existing code and objectives. Provide or restore this file for full directive traceability.
- DATABASE_URL vs NETLIFY_DATABASE_URL dual support exists in src/lib/health.ts; pending unification to canonical DATABASE_URL across app and functions.

## 🚧 Remaining Tasks
- [ ] Refactor SettingsNavigation → shared component under /components/common/
- [ ] Consolidate cron logic under src/lib/cron/scheduler.ts
- [ ] Update Prisma env reference → canonical DATABASE_URL
- [ ] Add CI check for duplicate routes or components (completed for API routes; extend to components if desired)

## 🔧 Next Steps
- [ ] Remove any remaining legacy files and update docs referencing deprecated paths
- [ ] Continue with SettingsNavigation consolidation
