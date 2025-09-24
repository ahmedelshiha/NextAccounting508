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
