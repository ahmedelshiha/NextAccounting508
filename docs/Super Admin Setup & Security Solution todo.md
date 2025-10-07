## ✅ Completed
- [x] Prepared Prisma migration to add `superAdmin` JSON column to `security_settings` and updated seed to ensure defaults.
  - **Why**: enable persistent tenant-level SUPER_ADMIN overrides (stepUpMfa, logAdminAccess)
  - **Impact**: consistent defaults; safe, backward-compatible rollout

## 🚧 In Progress
- [ ] Awaiting remote DB credentials (NETLIFY_DATABASE_URL) and target environment (staging/prod) to apply migration and seed.

## 🔧 Next Steps
- [ ] Apply migration and seed
  1. Set NETLIFY_DATABASE_URL to the remote Postgres connection string.
  2. Run: pnpm db:migrate && pnpm db:seed
  3. Verify:
     - SELECT column_name FROM information_schema.columns WHERE table_name='security_settings' AND column_name='superAdmin';
     - SELECT superAdmin FROM public.security_settings LIMIT 5;
