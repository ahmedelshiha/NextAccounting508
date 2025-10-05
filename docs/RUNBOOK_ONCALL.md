# On-Call Runbook

## Communication Channels
- **Pager / Alerts:** Sentry alerts, Netlify function failures, and monitoring scripts notify via Slack webhook configured by `SLACK_WEBHOOK_URL`.
- **Escalation:** If Slack fails, use email distribution list `ops@accountingfirm.com` or call escalation tree documented in internal handbook.

## Immediate Checklist (P0/P1)
1. Acknowledge alert in monitoring channel (Sentry, Slack, or email).
2. Verify incident scope using `monitoring/dashboard.html` and Sentry issue details.
3. Check production status page (`/status`, `/api/admin/system/health`, `/api/system/health`).
4. If database affected, confirm Supabase/Neon console health and review recent migrations or scripts.
5. Communicate status update to stakeholders within 15 minutes.

## Common Incidents
### Cron Failures
- Symptoms: Missing reminders, telemetry gaps, or Netlify cron errors.
- Actions:
  - Inspect Netlify function logs for `cron-reminders`, `cron-payments-reconcile`, `health-monitor`.
  - Validate `CRON_SECRET` configured in environment and matches scheduled job headers.
  - Use manual trigger: `curl -X POST https://<domain>/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"`.

### Prisma / Database Connectivity
- Symptoms: 500 errors referencing Prisma, connection refused, or tenant guard failures.
- Actions:
  - Check `DATABASE_URL` / `NETLIFY_DATABASE_URL` secrets; ensure connection string valid.
  - Review Prisma logs via `scripts/monitoring/health-check.js`.
  - Run `pnpm db:push` in maintenance window if schema drift suspected.
  - Confirm `POSTGRES_SCHEMA` overrides where relevant.

### Stripe Webhook Errors
- Symptoms: Failed payment events, invoice sync issues.
- Actions:
  - Inspect `/api/payments/webhook` logs; confirm `STRIPE_WEBHOOK_SECRET`.
  - Replay events from Stripe dashboard once resolved.
  - Verify downstream invoice status updates via `/api/admin/invoices`.

### Uploads / ClamAV Failures
- Symptoms: Uploads stuck in quarantine, scanning errors.
- Actions:
  - Check `clamav-service/` container logs; ensure `start.sh` service running.
  - Confirm `UPLOADS_AV_SCAN_URL` reachable and returns expected JSON.
  - If provider tokens expired, rotate `NETLIFY_BLOBS_TOKEN` and redeploy.

### Realtime / Redis Issues
- Symptoms: Notifications not propagating, chat offline warnings.
- Actions:
  - Verify `REDIS_URL` or Upstash credentials; check Upstash dashboard.
  - Confirm `REALTIME_TRANSPORT`, `REALTIME_PG_URL`, and channel names.
  - Fallback to memory transport by setting `REALTIME_TRANSPORT=memory` temporarily.

## Disaster Recovery
- **Database:** Utilize provider snapshots; run `scripts/db-fix-*` utilities for constraint repair after restore.
- **Environment Variables:** Source from secure vault; run `pnpm check:env` post-restore.
- **Static Assets:** Redeploy Next.js build (`pnpm build`) and rehydrate `.next` output.

## Postmortem Actions
1. Document incident timeline (trigger, diagnosis, remediation, verification).
2. File follow-up issues for long-term fixes (e.g., automation, alert tuning).
3. Update runbook and monitoring dashboards with new learnings.
