## ✅ Completed (append)
- [x] Standardized Prisma datasource to env('DATABASE_URL') with two-way mapping in prisma.config.ts
  - **Why**: eliminate env drift between Netlify/Neon and local; follow canonical var
  - **Impact**: prisma generate/builds align across environments; legacy NETLIFY_DATABASE_URL still supported via mirroring
