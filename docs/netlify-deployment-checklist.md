# Netlify Deployment Checklist — Admin Settings

Use this checklist to deploy settings features (Organization, Booking, Financial, Communication, etc.) on Netlify safely.

- [ ] Environment variables
  - Set in Netlify UI (never commit secrets):
    - NEXTAUTH_URL, NEXTAUTH_SECRET
    - DATABASE_URL (Neon/Supabase/Postgres)
    - SENDGRID_API_KEY, FROM_EMAIL (if email sending)
    - STRIPE_SECRET_KEY (if payments), CRON_SECRET (if scheduled jobs)
  - Optional: MULTI_TENANCY_ENABLED, REDIS_URL
- [ ] Build settings
  - Base: /
  - Build command: pnpm vercel:build (uses Prisma generate + lint + typecheck + build)
  - Publish directory: .next
  - Netlify Next.js plugin enabled (see netlify.toml)
- [ ] Prisma
  - Ensure DATABASE_URL is set for build to generate Prisma client.
  - Apply migrations outside of build (CI or manual): pnpm db:migrate
- [ ] Functions and Cron
  - netlify/functions/* deployed automatically
  - Schedule via Netlify Background Functions or external cron hitting functions (e.g., /.netlify/functions/cron-reminders)
- [ ] Caching & Edge
  - Middleware enforces RBAC for /admin/settings/* (see src/app/middleware.ts)
  - Headers: Cache-Control no-store applied for admin/portal in middleware
- [ ] Testing pre-deploy
  - pnpm typecheck
  - pnpm test (unit + API)
  - pnpm test:integration (if applicable)
  - e2e optional: pnpm e2e:ci
- [ ] Post-deploy validation
  - Verify routes: /admin/settings/company, /booking, /financial, /communication
  - Verify permissions for TEAM_MEMBER vs ADMIN
  - Test GET/PUT on each settings page
- [ ] Monitoring
  - Enable Sentry (dsn env vars) or Netlify logs
  - Review netlify/functions/health-monitor.ts

Notes
- Do not log secrets. Avoid printing envs in runtime logs.
- For masked secrets in Integration Hub, ensure UI only sends masked updates and audit events record metadata, not raw secrets.
