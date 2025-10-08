
## ✅ Completed
- [x] Fixed Vercel build errors in auth/session handling and test setup
  - Why: build failure (TS2339 in src/lib/api-wrapper.ts; TS2698 in vitest.setup.ts)
  - Impact: restores typecheck; safer dynamic auth access compatible with mocks; stable tests

## ⚠️ Issues / Risks
- redundancy-report.md not found; proceeding with cleanup via existing repository context and prior TODO state. Add the report to align priorities if available.

## 🚧 In Progress
- [ ] Audit for duplicated auth/preview login routes and unify flow

## 🔧 Next Steps
- [ ] Standardize any remaining direct next-auth calls to use centralized helpers
- [ ] Run tests and lint; address any follow-ups discovered
