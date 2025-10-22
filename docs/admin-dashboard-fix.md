# Admin Dashboard: Realtime stability and logging fix

This document records the latest changes applied to stabilize realtime updates on the Admin Dashboard and remove noisy build logs.

## Summary
- Eliminated noisy "Realtime PG adapter init failed" messages during builds.
- Prevented build-time database connections that caused `password authentication failed for user 'neondb_owner'` in certain CI environments.
- Preserved realtime features for the Admin Dashboard with safer, lazy initialization.

## Root cause
The realtime Postgres adapter was eagerly connecting to the database at import time. During static builds/trace, this could trigger DB auth errors and spam logs when credentials were not available to that phase.

## Changes implemented
- Lazy initialization of the Postgres adapter; connect only on first actual use (first SSE subscriber or first publish):
  - File: `src/lib/realtime-enhanced.ts`
  - New behavior: no DB connection at import time; adapter connects when `subscribe()` is called or when an event is published.
- Environment guards:
  - Falls back to in-memory transport when not in a Node runtime.
  - Falls back when `REALTIME_PG_URL`/`DATABASE_URL` are not set.
- Non-breaking: `RealtimeProvider` and SSE endpoints continue to function; cross-instance fan-out still works when Postgres transport is properly configured.

## Configuration
- Default transport remains in-memory.
- To enable Postgres-backed fan-out (recommended for multi-instance deploys):
  - Set `REALTIME_TRANSPORT=postgres` (alias: `pg`/`neon`).
  - Set `REALTIME_PG_URL` (or rely on `DATABASE_URL`).
  - Optional: `REALTIME_PG_CHANNEL` (default: `realtime_events`).
- See: `docs/ENVIRONMENT_VARIABLES_REFERENCE.md` (Realtime & Cache section).

## Affected code paths
- Adapter: `src/lib/realtime-enhanced.ts`
- SSE endpoint: `src/app/api/admin/realtime/route.ts` (runtime: `nodejs`)
- Admin providers: `src/components/admin/providers/AdminProviders*.tsx` (wraps with `RealtimeProvider`)

## Verification
1. Build: run CI/build – logs should no longer contain PG init failures during the build stage.
2. Runtime:
   - Open the Admin Dashboard; ensure widgets that rely on realtime continue to render without console errors.
   - Hit `/api/admin/realtime` from a logged-in session (SSE) and confirm an initial `connected` event.
   - Trigger an event (e.g., update a Service Request) and confirm dashboard updates or see events delivered.

## Rollback / Safety
- To temporarily disable Postgres fan-out across instances, set `REALTIME_TRANSPORT=memory`.
- No schema changes; safe to deploy/rollback.

## Notes
- React function components did not require changes; existing `React.FC` usages are unaffected by this fix.
- No secrets are logged by the new adapter behavior.
