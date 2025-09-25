# RBAC Audit Script

This script performs a fast audit of admin API routes under src/app/api/admin and ensures each route validates the session or permissions.

How it works
- Scans for files matching: src/app/api/admin/**/route.ts
- For each file, checks whether it includes getServerSession(...) or hasPermission(...)
- If neither is present, the file is reported as missing RBAC checks and the script exits with code 2

How to use
- Run locally: node scripts/check_admin_rbac.js
- CI: add `pnpm check:rbac` as a separate job or as part of your test pipeline.

How to override
- If a route is intentionally public or uses a different auth mechanism, add a top-level comment in the file:
  // RBAC_IGNORE

Next steps
- For each reported file, add a permission check at the top of the handler, for example:

  const session = await getServerSession(authOptions)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.TEAM_MANAGE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

- Prefer centralized helpers for guard logic to keep handlers concise.
