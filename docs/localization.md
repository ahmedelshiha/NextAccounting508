Localization & Language Control — Complete Audit + Implementation Tasks

Last updated: 2025-10-21
Author: Assistant (code audit)

1 Executive summary

This document consolidates the previous audit of localization and language control and adds an ordered, actionable todo list for implementing fixes and improvements. Tasks are prioritized (P0 high, P1 medium, P2 low, P3 optional). Use this as the single source of truth for implementation work and tracking.

2 Audit summary (short)

- Per-user localization (timezone + preferredLanguage) is editable by authenticated users via LocalizationTab and the API at PUT /api/user/preferences.
- Tenant context + session checks are enforced. No role-based requirement is needed to update one’s own preferences.
- Admin-level communication settings remain in /admin/settings/communication and are permission-gated.
- Main risks: malformed reminderHours payloads (Prisma type errors), insufficient client validation/casting, and error messages that impede debugging.

3 Prioritized todo tasks

P0 — Critical (fix before next deploy)

- P0-1: Server: Coerce reminderHours to numbers + robust validation
  - Files: src/app/api/user/preferences/route.ts
  - Description: Before calling prisma.upsert, coerce reminderHours values to Number and filter out invalid values. Return a clear 400 when the client payload is invalid. Catch Prisma type errors and log them to Sentry with minimal payload context.
  - Acceptance criteria: No Prisma type errors from reminderHours; server returns 400 on invalid payload; Sentry receives events for DB upsert failures.

- P0-2: Client: Strict validation and casting in LocalizationTab
  - Files: src/components/admin/profile/LocalizationTab.tsx, src/components/admin/profile/constants.ts
  - Description: Validate preferredLanguage against VALID_LANGUAGES before sending. Ensure reminderHours (if exposed) are numeric arrays. Show field-level validation before calling updatePreferences.
  - Acceptance criteria: Client never sends strings for reminderHours; invalid language selection blocked; tests added.

- P0-3: Tests: Add tests covering Localization save flow
  - Files: tests/api/user-preferences.test.ts, tests/components/localization-save.test.tsx
  - Description: Add unit/integration tests for success, 400, 500, and 429 scenarios.
  - Acceptance criteria: Tests run and pass locally/CI.

P1 — High

- P1-1: Hook: Improve SWR rollback and revalidation
  - Files: src/hooks/useUserPreferences.ts
  - Description: After failed optimistic update, rollback and revalidate from server (mutate(previousData, true) or call mutate()). Ensure stale closures don't cause incorrect rollback.
  - Acceptance criteria: UI state matches server after failure; no flapping.

- P1-2: API Hardening & rate-limit per-user
  - Files: src/app/api/user/preferences/route.ts, src/lib/rate-limit.ts
  - Description: Sanitize logged payloads (no PII). Add per-user rate-limiter key in addition to per-IP to avoid shared-IP false positives.
  - Acceptance criteria: Logs do not include raw PII; rate-limit triggers per-user.

- P1-3: Locale mapping utility
  - Files: src/lib/locale.ts, update src/lib/cron/reminders.ts
  - Description: Map short language codes ('en','ar','hi') to BCP47 (e.g., 'en' -> 'en-US') before formatting messages.
  - Acceptance criteria: Cron/emails render with correct locale formatting.

P2 — Medium / UX & Docs

- P2-1: UX: Inline field errors in LocalizationTab
  - Files: src/components/admin/profile/LocalizationTab.tsx
  - Description: Replace generic toast with field-level messages when server returns validation errors.
  - Acceptance criteria: Users see inline errors for timezone/language.

- P2-2: Documentation: Update docs/localization.md with implementation notes and test results
  - Files: docs/localization.md
  - Description: Keep this document updated (this step completed now).
  - Acceptance criteria: Document reflects changes and links to tasks.

- P2-3: Monitoring: Sentry breadcrumbs & alerts
  - Files: Sentry config + server route instrumentation
  - Description: Add breadcrumb events on preference updates and an alert for repeated failures.
  - Acceptance criteria: Alerts for >5 failures/hr.

P3 — Optional

- P3-1: Admin support view for user locale
  - Files: src/components/admin/support/UserLocaleView.tsx
  - Description: Permission-gated UI to view user's timezone/language for support. Requires new permission or reuse COMMUNICATION_SETTINGS_VIEW.
  - Acceptance criteria: Only admins see the UI.

4 Implementation guidance & checklists

4.1 Server: coercion snippet (suggested)

- Before upsert:
  - if (reminderHours) {
  -   const nums = Array.isArray(reminderHours) ? reminderHours.map((x) => Number(x)).filter((n) => Number.isFinite(n)) : undefined
  - }
  - Validate length and range afterwards.

4.2 Client: validation examples

- preferredLanguage:
  - if (!VALID_LANGUAGES.includes(value)) setFieldError('preferredLanguage', 'Unsupported language')
- reminderHours:
  - parse ints, filter NaN, ensure within 1..720

4.3 Tests to add

- API: PUT /api/user/preferences
  - valid payload -> 200 and updated body
  - invalid timezone -> 400
  - invalid reminderHours (string values) -> 400
  - DB upsert failure (mock Prisma throw) -> 500
  - rate limited -> 429

- UI component: LocalizationTab
  - sets validation error on invalid language
  - saves successfully with valid payload (mock apiFetch)

5 Tracking & todo integration

I converted the audit to a session todo list (10 tasks). The tasks are ordered by priority and included in docs/localization.md for reference. Use the todo list to pick the next item and mark it in_progress/completed as you go.

6 Next steps for me

I can start implementing any P0 task now. Recommend starting with P0-1 (server reminderHours coercion + Sentry capture). Confirm and I will implement the server change, tests, and update docs accordingly.
