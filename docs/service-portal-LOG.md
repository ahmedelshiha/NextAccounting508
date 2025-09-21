## 2025-09-21 — Offline booking queue + Background Sync (Phase 1)

Summary
- Implemented a client-side IndexedDB queue for portal service request submissions when offline.
- Added service worker Background Sync to flush the queue when connectivity is restored.
- Updated portal New Service Request page to detect offline state, enqueue payloads, and notify the user.

Why
- Enables robust submissions in unreliable network conditions and improves UX for mobile clients.

Files Changed
- public/sw.js (add Background Sync queue processing)
- src/lib/offline-queue.ts (new: IndexedDB queue + helpers)
- src/app/portal/service-requests/new/page.tsx (enqueue + sync registration + recovery)

Next Steps
- Add UI indicator for pending queued items and submission history in portal list view.
- Gate PWA features behind NEXT_PUBLIC_ENABLE_PWA and add simple telemetry for cache hits.
- Optional: Add retry backoff and cap to queue processing; handle attachment re-uploads.

---

