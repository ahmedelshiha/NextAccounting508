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

---

Update:
- Began payment status reflection plumbing: added payment fields to ServiceRequest, webhook now links Stripe sessions to matching requests and marks PAID/FAILED, checkout optionally binds session to an existing ServiceRequest.

Why:
- Provides end-to-end visibility of payment state and a foundation for admin UI reconciliation.

Files changed/added:
- prisma/schema.prisma (UPDATED) — PaymentStatus enum and ServiceRequest payment fields
- src/app/api/payments/webhook/route.ts (UPDATED) — update SR on session completed/failed
- src/app/api/payments/checkout/route.ts (UPDATED) — metadata includes serviceRequestId; pre-mark pending payment

Next steps:
- Expose payment status in admin service-requests table and details view; add nightly reconciliation job.

Logged by: Autonomous Dev (assistant)
