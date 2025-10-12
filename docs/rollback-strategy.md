# Rollback Strategy & Freeze Windows

## Principles
- Prefer fast, reversible rollbacks over forward-only fixes.
- Separate deploy from release using feature flags.

## Mechanisms
- Feature Flags
  - Server-checked flags for sidebar features, shortcuts, and new settings UX.
  - Env vars evaluated at edge/server; default to safe values.
- Config Toggles
  - Next.js headers/CSP, experimental flags guarded behind environment checks.
- Database
  - Use Prisma migrate with reversible scripts; avoid destructive changes without shadow tables/backfills.
  - Roll forward/back using `prisma migrate deploy` and `prisma migrate resolve` with clear playbooks.
- Deploy Rollback
  - Netlify: rollback to last successful deploy via UI/API.
  - Vercel: promote previous deployment; keep two healthy builds at all times.

## Freeze Windows
- During release week (Thu–Mon): dependency freeze; security/critical hotfix only.

## Monitoring & Gates
- SLOs: P99 API latency < 400 ms; error rate below threshold.
- Health checks: /api/admin/system/health and /api/security/health gated in CI before release.

## Incident Response
- Triage in #incidents, page on-call.
- Immediate actions: disable new flags, rollback deploy, verify health.
- Postmortem within 48 hours using template in docs/communication-plan.md.
