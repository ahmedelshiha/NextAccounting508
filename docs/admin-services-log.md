

## [2025-09-24] Deployment readiness & Netlify
What I changed:
- Prepared deployment guidance and Netlify-specific instructions in DEPLOYMENT.md, including environment variable recommendations, migration handling via netlify.toml and scripts/prisma-deploy-retry.sh, CI pre-deploy checks, backup/rollback guidance, and suggested MCP integrations (Neon, Netlify, Sentry, Builder CMS, etc.).

Why:
- Ensure safe, repeatable production deployments with migration safety, monitoring, and secrets handling.

Next steps:
- Add GitHub Actions CI workflow to run typecheck, lint, tests and optional build on PRs.
- Add frontend UI to surface analytics revenueTimeSeries and bulk action progress UI.
- Add automated smoke tests post-deploy and Sentry integration for production monitoring.
