# Release Process

## Branching & Versioning
- Work from feature branches merged into `main` via PR with code review.
- Tag releases using semantic versioning (`vX.Y.Z`). Maintain CHANGELOG entries per release.

## Pre-Release Checklist
1. Confirm feature freeze and merge readiness.
2. Update documentation: `README.md`, `docs/PROJECT_SUMMARY.md`, relevant runbooks.
3. Ensure tests pass locally: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, targeted suites, and optional `pnpm test:e2e`.
4. Review dependency updates; pin versions for critical packages.
5. Announce release window to stakeholders.

## Release Build
1. Create release branch `release/vX.Y.Z`.
2. Run `pnpm build` to confirm production build.
3. Execute database migrations against staging: `pnpm db:migrate deploy`.
4. Smoke test staging environment using `pnpm monitoring:health` and key journeys.
5. Update CHANGELOG with final notes and PR references.

## Deployment Steps
- **Vercel:** Promote latest `main` deployment or trigger manual build from release branch.
- **Netlify:** Deploy via CI pipeline or manual build; ensure `netlify.toml` configuration verified.
- **Self-Hosted:** Build Docker image, push to registry, and update ECS/Kubernetes/PM2 deployment.
- Run Prisma migrations on production post-deploy (`pnpm db:migrate deploy` or `pnpm db:push`) with maintenance window if necessary.

## Post-Deployment Verification
- Check Sentry for new errors; update alert thresholds if noisy.
- Validate cron jobs triggered successfully (manual POST to `/api/cron/reminders`).
- Run high-level UI smoke tests (admin dashboard, portal booking, uploads, payment flow).
- Verify Stripe webhooks processed and logs clean.

## Rollback Strategy
- Maintain previous deployment artifacts (Vercel/Netlify history, Docker tags).
- Reapply last stable Prisma schema if DB changes required rollback.
- Communicate rollback decision promptly and update incident channel.

## Communication
- Publish release notes summarizing features, fixes, migrations, and known issues.
- Notify customer support and internal teams of rollout completion.
- Schedule retrospective for major releases to capture learnings.

## Continuous Improvement
- Track deployment metrics (lead time, failure rate, MTTR).
- Automate smoke tests and post-deploy verification where possible.
- Regularly revisit release process for efficiency and reliability gains.
