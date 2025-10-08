## ✅ Completed
- [x] F1: Consolidated auth register routes; legacy /api/auth/register/register now redirects to canonical /api/auth/register
  - Why: remove duplicate route surface
  - Impact: single source of registration logic; legacy clients supported via 307 redirect
- [x] F2: Unified dev login to /api/_dev/login; /api/dev-login redirects
  - Why: prevent ambiguous dev entrypoints
  - Impact: safer gating; single path in tests and docs
- [x] F3: Extracted shared health module at src/lib/health.ts and refactored routes to use it
  - Why: avoid drift across health endpoints/functions
  - Impact: consistent health payloads
- [x] F4: De-duplicated usePerformanceMonitoring; only src/hooks/usePerformanceMonitoring.ts remains
  - Why: remove import ambiguity
  - Impact: stable imports
- [x] F5: Consolidated SettingsNavigation to src/components/admin/settings/SettingsNavigation.tsx with barrel re-export at src/components/admin/SettingsNavigation.tsx
  - Why: avoid UI drift
  - Impact: single source, backward-compatible imports
- [x] F6: Fixed duplicate import in e2e/playwright.config.ts
  - Why: cleanup redundancy
  - Impact: cleaner config, no duplication warnings
- [x] F8: Standardized Prisma datasource to DATABASE_URL; prisma.config.ts mirrors NETLIFY_DATABASE_URL→DATABASE_URL. Set DATABASE_URL from env.
  - Why: eliminate env drift
  - Impact: consistent DB connection locally and on Netlify/Vercel

---

## ✅ Completed (2025-10-08)
- [x] Fix build parsing error in src/lib/api-wrapper.ts
  - Why: unblock Netlify build (ESLint parsing error: "catch or finally expected" at line ~70)
  - Impact: restored lint/typecheck/build pipeline; robust session resolution with fallbacks; added JSDoc
- [x] Implement canonical /api/auth/register API
  - Why: unify registration flow; remove duplicated routes
  - Impact: register page and admin client creation now target a single endpoint; tenant-aware user creation; safe demo/DB-less handling

## ⚠️ Issues / Risks
- Registration disabled when DB is not configured (returns 503), by design.

## 🚧 In Progress
- [ ] Confirm no remaining preview-login duplicates; keep single fallback in next-auth authorize

## 🔧 Next Steps
- [ ] Add unit tests for /api/auth/register input validation and conflict handling
- [ ] Scan for legacy /auth/register page routes and remove/redirect if found
