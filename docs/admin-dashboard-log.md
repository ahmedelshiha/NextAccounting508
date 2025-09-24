## 2025-09-27 – Chat offline enqueue/flush test
- Added integration test (tests/integration/chat-offline.test.ts) that simulates pending chat messages in localStorage and invokes the POST /api/portal/chat handler for each queued message.
- Verified messages are added to in-memory chat backlog (chatBacklog) after POSTs.
- This provides confidence that the client-side flush logic (on 'online' event) will result in server-side message handling and in-memory persistence.
- Next: A11y/i18n sweep across portal UI strings and audit for any hard-coded user-facing text.
