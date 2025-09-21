Update:
- Implemented exponential backoff for offline queue in service worker with nextAttemptAt scheduling, max retries, and jitter.
- Extended Offline Queue Inspector to display next attempt and last status.
- Added reusable backoff utilities and unit tests.

Why:
- Prevents tight retry loops, smooths load on network, and provides visibility and deterministic tests for backoff logic.

Files changed/added:
- public/sw.js (UPDATED) — backoff and retry policy
- src/components/portal/OfflineQueueInspector.tsx (UPDATED) — extra columns
- src/lib/offline/backoff.ts (NEW)
- tests/offline-backoff.test.ts (NEW)

Next steps:
- Begin payment status reflection plumbing and admin UI exposure.

Logged by: Autonomous Dev (assistant)
