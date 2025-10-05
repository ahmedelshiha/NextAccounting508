# Incident Response Plan

This guide outlines how to detect, triage, mitigate, and recover from incidents.

## Detection
- Alerts via Sentry and health monitors (`/api/security/health`, `/api/admin/system/health`, `netlify/functions/health-monitor.ts`).
- User reports via GitHub Issues (use "bug report" template).

## Triage
- Assign an Incident Commander and Scribe.
- Classify severity (SEV1–SEV4) based on impact to tenants and data.
- Scope affected services and versions.

## Mitigation
- Roll back recent deployments if necessary.
- Disable risky paths (e.g., dev login in production) and rotate secrets.
- Apply hotfixes behind feature flags.

## Communication
- Update status page/channel (if applicable).
- Post incident updates at regular intervals (e.g., every 30–60 minutes for SEV1/2).

## Forensics
- Preserve logs and relevant DB snapshots.
- Record timeline of events and fixes.

## Recovery
- Validate system health, run smoke/E2E tests, and confirm tenant operations.

## Postmortem
- Within 5 business days, publish a blameless postmortem with:
  - Summary, impact, timeline, root cause
  - Remediation and prevention tasks
  - Follow-ups added to ROADMAP.md and tracked as issues

See also: docs/RUNBOOK_ONCALL.md, docs/SECURITY_GUIDELINES.md, docs/DATA_PRIVACY.md.
