
## ✅ Completed (2025-10-08)
- [x] Add CI guardrail scripts and tests
  - Why: prevent reintroduction of duplicates and verify shared utilities
  - Impact: check:duplicates now validates API and critical component duplicates; unit tests cover cron scheduler and register route

## ✅ Completed (2025-10-08)
- [x] Consolidated SettingsNavigation to canonical src/components/admin/settings/SettingsNavigation.tsx; added barrel at src/components/admin/SettingsNavigation.tsx
  - Why: remove duplicate UI entrypoints and drift
  - Impact: existing imports keep working; single source of truth

## 🔧 Next Steps
- [ ] Extend duplicate checks to detect dev-only exports in production builds
- [ ] Add more coverage for register flow (conflict 409, missing name)
