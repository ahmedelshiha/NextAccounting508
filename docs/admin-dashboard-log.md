## 2025-09-27 – Chat offline enqueue/flush test
- Added integration test (tests/integration/chat-offline.test.ts) that simulates pending chat messages in localStorage and invokes the POST /api/portal/chat handler for each queued message.
- Verified messages are added to in-memory chat backlog (chatBacklog) after POSTs.
- This provides confidence that the client-side flush logic (on 'online' event) will result in server-side message handling and in-memory persistence.
- Next: A11y/i18n sweep across portal UI strings and audit for any hard-coded user-facing text.
- 2025-09-27: Started A11y/i18n sweep — translated LiveChatWidget strings and added aria-live role for message log. Updating locales for en/ar/hi.

## 2025-09-27 – Observability route tags
- Enhanced lib/observability.captureError to set Sentry tags when context is provided: route, feature, channel, tenantId, userId.
- Why: improves debugging and dashboards by enabling filtering/grouping by route/channel/tenant; critical for realtime (SSE/WebSocket) errors.
- Next: expand usage across more routes, add unit test to assert tags set via mocked Sentry scope.

## 2025-09-27 – SSE header integration test
- Updated tests/integration/portal-realtime.sse.test.ts to mock auth, prisma, and realtime service; asserts 200 and text/event-stream with proper caching headers; OPTIONS returns Allow: GET,OPTIONS.
- Why: validates basic SSE contract for portal realtime endpoint without relying on live DB or network.
- Next: add test that asserts a connect healthLog entry is created (via mocked prisma) and one initial data line is enqueued.

## 2025-09-27 – Portal cancel flow and export filters integration tests
- Added tests: tests/integration/portal-bookings-cancel.test.ts (DELETE cancel path with tenant/ownership) and tests/integration/portal-export.filters.test.ts (CSV respects status/q and appointments date window).
- Why: increases confidence in critical portal flows before adding E2E. Confirms server-side contract; UI cache update left for Playwright.
- Next: add Playwright E2E to verify UI cache mutation on cancellation and streamed CSV large datasets.
