# Migration Guide (Database & Breaking Changes)

This guide covers database migrations and breaking application changes.

## Database Migrations
### Local/Dev
```bash
pnpm db:generate
pnpm db:push
```

### Production
- Use declarative migrations with Prisma:
```bash
pnpm db:migrate
```
- On Netlify, migrations can be enabled via `RUN_DB_MIGRATIONS=true` (see netlify.toml notes). Ensure advisory lock timeout is sufficient.
- Seed data only when safe/idempotent: `pnpm db:seed`.

### Rollback Strategy
- Keep backups before deploy.
- Use advisory locks to prevent concurrent migrations.
- Roll forward preferred; otherwise revert migration and redeploy.

## App-Level Breaking Changes
- Use feature flags to roll out changes gradually.
- Update schemas in `src/schemas` and ensure all `src/app/api` handlers validate inputs.
- Run unit, integration, and E2E tests; verify performance thresholds.

## Tenant Safety
- Respect Row-Level Security and tenant scoping utilities.
- Validate cross-tenant indexes and unique constraints during migrations.
