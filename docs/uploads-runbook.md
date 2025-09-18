# Uploads Runbook: Quarantine & AV Webhook Handling

Purpose: describe operational steps to handle antivirus (AV) scans, quarantine infected files, retry logic, and UI behavior for uploads in the Service Portal.

Applicable code paths:
- Server upload handler: src/app/api/uploads/route.ts
- Portal upload UI: src/app/portal/service-requests/new/page.tsx
- Audit logging: src/lib/audit.ts

Requirements & envs:
- UPLOADS_PROVIDER (netlify|supabase|local)
- NETLIFY_BLOBS_TOKEN (if using Netlify Blobs)
- UPLOADS_AV_SCAN_URL (url receiving POST to scan uploaded object)
- A quarantine storage prefix/bucket (e.g., `quarantine/` path in provider)

Key responsibilities
1. Scan uploaded files with AV service (sync or async).
2. If infected: move object to quarantine, mark metadata with infection flag, set uploadError for client, emit audit event, notify operators.
3. Allow operators to review quarantined items and release or delete after triage.
4. Provide retry mechanism for clients if upload was rejected (either due to transient AV failures or allowed after operator review).

Design patterns implemented
- Best-effort AV webhook: upload route will call UPLOADS_AV_SCAN_URL after successful storage upload and will accept async callback or synchronous response.
- Metadata model (attachment record) includes: name, size, type, url, uploadedAt, avStatus (pending|clean|infected|error), avDetails.
- Quarantine: infected files moved to provider path `quarantine/<objectKey>` and made private.
- Audit log: logAudit({ action: 'upload', actorId, targetId: requestId, details: { filename, avStatus } })

Operational runbook

1) Normal upload flow (no AV configured)
  - Upload saved using provider; response returned to client with public URL.
  - Audit event emitted: upload completed (avStatus: 'not_configured').
  - No quarantine or AV steps applied.

2) Upload flow with AV webhook (synchronous expected)
  - Server uploads file to provider and POSTs to UPLOADS_AV_SCAN_URL with object metadata.
  - If AV returns clean -> mark avStatus: 'clean', return public URL.
  - If AV returns infected -> move object to quarantine path, mark avStatus: 'infected', return success with uploadError explaining infection, and emit audit.
  - If AV returns temporary error or timeout -> mark avStatus: 'error', return success with warning and set upload metadata for re-scan; schedule background retry job (if available) or provide operator alert.

3) Upload flow with AV webhook (async callback)
  - Server uploads file and returns temporary URL / processing state; avStatus: 'pending'.
  - UPLOADS_AV_SCAN_URL will call back (or the AV provider will POST) to server callback endpoint (e.g., /api/uploads/av-callback) with scan results.
  - On callback: if clean -> set avStatus: 'clean' and update attachment record; if infected -> move to quarantine and set avStatus: 'infected' and emit audit + notify client via in-app notification and email.

Operator triage (Admin)
- Admin interface should present quarantined uploads with: filename, uploader, requestId, upload timestamp, AV details, provider object key.
- Actions: Delete (remove object), Release (move back to public storage and set avStatus: 'released' with audit), Export logs.
- Recommended guard: Only allow release after manual verification by a senior operator.

Retries & client UX
- The portal UI shows per-file errors and allows Retry Upload for files with avStatus 'error' or transient network failures.
- For infected files, show a clear message: "This file was rejected by our antivirus scan. Please remove sensitive content and try again or contact support." Do NOT allow retry to bypass quarantine automatically.

Monitoring & alerts
- Emit audit events for any infected upload and AV errors.
- Monitor AV webhook failure rates and quarantine counts in your observability tool (Sentry, metrics dashboards).
- Create an alert if infections exceed a small threshold in a day (e.g., >5 infected files/day).

Implementation checklist for devs (recommended tasks)
- Ensure attachment metadata is persisted in DB (attachments JSON for service request or a separate attachments table).
- Add admin UI for quarantined items (route: /admin/audits/uploads or /admin/uploads/quarantine).
- Add endpoint /api/uploads/av-callback to accept AV callbacks and verify signature (if AV provider signs callbacks).
- Add provider move/copy utilities in src/lib/uploads-provider.ts to allow moving objects to quarantine.
- Add background re-scan job or retry queue (serverless cron or job runner) to retry avStatus: 'error'.

Contact & runbook owner
- Owner: Platform Ops / Dev team
- Pager: Configure alerting in Sentry or your monitoring platform to notify on high error/infected rates.

This runbook is intentionally prescriptive to allow operators to act quickly when uploads fail or are flagged by AV.
