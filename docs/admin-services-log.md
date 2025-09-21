## [2025-09-21] Netlify preview smoke test workflow extended
What I updated:
- Extended the preview smoke test to check /api/db-check and /api/admin/system/health in addition to root /. The workflow treats a 401 from the admin health endpoint as "reachable" (auth-protected), but requires /api/db-check to return 200.

Why:
- Ensure critical backend health endpoints are reachable in preview builds. /api/db-check verifies DB connectivity; admin health confirms the health endpoint is reachable (even when auth-protected).

Next steps:
- Monitor smoke test runs on PRs. If admin system health should be publicly accessible for previews, we can either mock auth in CI or provision a preview-only API key/session to validate the endpoint fully.
