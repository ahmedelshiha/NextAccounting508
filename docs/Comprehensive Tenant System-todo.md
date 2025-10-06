
## ✅ Completed
- [x] Assessed RLS coverage and tenantContext usage; ensured tenant guard is applied to central Prisma client
  - **Why**: Prevent accidental cross-tenant reads/writes and ensure consistent enforcement across server code
  - **What I changed**:
    - Many operational scripts under scripts/ were updated to import the shared Prisma client (import prisma from '@/lib/prisma') so registerTenantGuard is applied consistently.
    - Ensured application code uses queryTenantRaw / withTenantRLS for raw SQL paths (db-raw.ts) and uses withTenantContext for App Router API routes.
  - **Files changed**: multiple scripts in scripts/ (backfills/migrations/inspection/seed scripts) and src/lib/default-tenant.ts, src/app/middleware.ts

## ⚠️ Remaining manual review items
- scripts/create_jwt_session.js still instantiates PrismaClient directly via require('@prisma/client'). It's a small utility script; consider migrating to shared prisma import when executing via tsx/tsx-compatible runner or convert to .ts.
- Any external Netlify functions or serverless contexts that create PrismaClient separately should be reviewed; run a grep for "new PrismaClient" in non-scripts folders if needed.

## 🚧 In Progress / Next steps
- [ ] Add regression tests asserting tenant-guard blocks cross-tenant operations and RLS enforcement for db-raw paths
- [ ] Run scripts in a staging preview to validate scripts now operate correctly with shared client
- [ ] Consider adding lint rule or developer guidance to always import shared prisma from '@/lib/prisma' to prevent future direct instantiations

