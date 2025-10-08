## ✅ Completed (2025-10-08)
- [x] Fix build parsing error in src/lib/api-wrapper.ts
  - Why: unblock Netlify build (ESLint parsing error: "catch or finally expected" at line ~70)
  - Impact: restored lint/typecheck/build pipeline; robust session resolution with fallbacks; added JSDoc
- [x] Implement canonical /api/auth/register API
  - Why: unify registration flow; remove duplicated routes
  - Impact: register page and admin client creation now target a single endpoint; tenant-aware user creation; safe demo/DB-less handling
- [x] Consolidate cron logic: add src/lib/cron/scheduler.ts and refactor /api/cron to use it; fix missing prisma import in src/lib/cron.ts
  - Why: eliminate duplicated secret checks; centralize task execution; prevent runtime error from missing import
  - Impact: consistent authorization for cron endpoints; improved reliability

## ⚠️ Issues / Risks
- Registration disabled when DB is not configured (returns 503), by design.

## 🚧 In Progress
- [ ] Confirm no remaining preview-login duplicates; keep single fallback in next-auth authorize

## 🔧 Next Steps
- [ ] Add unit tests for /api/auth/register input validation and conflict handling
- [ ] Add unit tests for cron scheduler authorizeCron/runCronTask
- [ ] Scan for legacy /auth/register page routes and remove/redirect if found
