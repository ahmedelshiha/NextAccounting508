
## ✅ Completed
- [x] Set NETLIFY_DATABASE_URL and DATABASE_URL for remote Neon DB (via dev server env config).
  - **Why**: enable Prisma to target the remote database for migration/seed
  - **Impact**: environment prepared for schema changes

## ⚠️ Issues / Risks
- ACL blocked running migration/seed commands from this environment.
  - Operators must execute: `pnpm db:migrate && pnpm db:generate && pnpm db:seed` in a shell with the same NETLIFY_DATABASE_URL.

## 🔧 Next Steps
- [ ] Ops: Run migrations and seed as above, then verify column and sample values exist as documented. Provide confirmation or logs to record in this file.
