## 2025-09-21 — Uploads & Antivirus integration tests

Summary
- Added uploads API tests for clean and infected (lenient policy) flows using Netlify Blobs mock.
- Added AV callback quarantine test and admin quarantine list/action tests.

Why
- Validates end-to-end behavior for AV scanning, quarantine, and admin operations without external dependencies.

Files Changed
- tests/uploads.clean.test.ts (new)
- tests/uploads.infected.lenient.test.ts (new)
- tests/admin-quarantine.route.test.ts (new)

Next Steps
- Configure envs on deploy (UPLOADS_PROVIDER=netlify, NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, UPLOADS_AV_POLICY, optional UPLOADS_AV_CALLBACK_SECRET).
