Localization & Language Control — Complete Audit

Last updated: 2025-10-21
Author: Assistant (code audit)

1 Executive summary

This document audits localization and language control logic across the codebase. It catalogs where localization is implemented, the roles/permissions that interact with it, access restrictions, and potential security / correctness issues. It concludes with prioritized recommendations and concrete code changes to improve safety, reliability, and observability.

Short conclusion:
- Per-user localization (timezone + preferredLanguage) is implemented and editable by authenticated users via the Localization tab and the API at PUT /api/user/preferences.
- No role-based permission is required to update one's own localization preferences — tenant context + authenticated session are enforced.
- Admin-level communication settings (separate feature) are permission-gated (COMMUNICATION_SETTINGS_*).
- Main risk areas: input type/shape issues (reminderHours), insufficient client-side validation/casting, and potential information leakage in error messages and logs. Rate limits and tenant context mitigate abuse but should be verified.

2 Scope & files inspected

UI / Client
- src/components/admin/profile/LocalizationTab.tsx
- src/components/admin/profile/constants.ts

Hooks / Client-network
- src/hooks/useUserPreferences.ts
- src/lib/api.ts (apiFetch)

Server / API
- src/app/api/user/preferences/route.ts
- src/app/api/portal/settings/booking-preferences/route.ts (related)

Schemas / Types
- src/schemas/user-profile.ts (PreferencesSchema + helpers)
- src/components/admin/profile/types.ts

Permissions & roles
- src/lib/permissions.ts (PERMISSIONS and ROLE_PERMISSIONS)

DB / Model
- prisma/schema.prisma (UserProfile model: timezone, preferredLanguage, reminderHours)

Tests & docs
- tests/api/user-preferences.test.ts
- tests/components/communication-settings.page.test.ts
- docs/* (various references)

3 Current behavior (summary)

- UI: LocalizationTab shows timezone select (COMMON_TIMEZONES), preferred language select (LANGUAGES). It validates timezone with isValidTimezone(client-side) and sets component state. On Save it calls updatePreferences(data) from useUserPreferences.

- Hook: useUserPreferences does SWR fetch to GET /api/user/preferences and supports updatePreferences (optimistic update) which PUTs partial preferences JSON to /api/user/preferences and rolls back on error. fetch and update use apiFetch which implements retries, timeout, and origin fallback.

- Server: /api/user/preferences
  - GET: requires tenant context (requireTenantContext), finds user by session email + tenantId and returns preferences (fallback defaults via PreferencesSchema when DB absent).
  - PUT: requires tenant context, rate-limited (20 writes/min per IP), validates request via PreferencesSchema.safeParse, re-checks timezone with isValidTimezone, verifies reminderHours range, finds user and upserts userProfile with supplied values, logs audit. Returns standardized { error } responses on failure.

- Roles/Permissions: No explicit permission check (role-based) is required for reading/updating a user's own preferences. Admin-level settings (communication) require COMMUNICATION_SETTINGS_* permissions.

4 Role / Permission mapping relevant to localization

Source: src/lib/permissions.ts

Key permissions and roles:
- PERMISSIONS.COMMUNICATION_SETTINGS_VIEW / EDIT / EXPORT / IMPORT — used for admin communication settings (not localization)
- ROLE_PERMISSIONS:
  - CLIENT: typical client privileges (creating service requests, read own)
  - TEAM_MEMBER, TEAM_LEAD: include various settings read/edit for booking/org depending on role
  - ADMIN, SUPER_ADMIN: include all permissions

Access mapping for localization functionality:
- Profile panel LocalizationTab (UI): Visible to all users (no PermissionGate). Controlled by ProfileManagementPanel which uses session and role to show Communication tab but not Localization. So any authenticated user who opens Manage Profile sees Localization.
- PUT /api/user/preferences: enforces tenant context and presence of user (session) but does NOT check role/permission. This allows any authenticated user to update their own timezone and preferredLanguage.
- GET /api/user/preferences: same (tenant + user presence required)

5 Access restriction summary (explicit checks found)

- requireTenantContext() (used in API routes) — ensures request has tenant context (session-based or server-side injected). If missing, endpoints return 401/500 depending on context.
- Rate limiting on PUT /api/user/preferences (20/min per IP) — applied to limit abuse.
- Database lookups limit updates to the user record that matches session userEmail + tenantId. The upsert uses where: { userId: user.id } (the user is found from session), preventing changing other users' profiles via this route.
- API responses are standardized to { error: '...' } format. Previously included details were trimmed; recent changes surface more diagnostic messages during debugging but should be sanitized in production logs.

6 Findings — security, correctness, and coverage

A. Correctness & Type Safety
- PreferencesSchema enforces preferredLanguage to z.enum(['en','ar','hi']). UI sometimes assigns string from select without cast; LocalizationTab uses a cast to satisfy TypeScript but client validation could be stricter before sending. Tests cover some cases.
- reminderHours are Int[] in Prisma. If the client sends reminderHours as strings (e.g., from form inputs), Prisma upsert may throw a DB type error. useUserPreferences and PUT route rely on Zod to validate reminderHours are numbers, but client-side UI must ensure numeric type.

B. Access Control
- No role-based restriction for modifying one's own preferences — this is expected behavior. However, there's no explicit protection against a compromised session acting with tenant context to change preferences for any user. The server finds user by session email so the session must be trusted.
- No endpoint exists for changing another user's preferences (good). Admins can modify system-wide defaults via separate admin settings.

C. Rate Limiting & Abuse
- PUT rate limit mitigates brute-force updates but might block legitimate frequent updates from same IP (e.g., mobile networks). Consider per-user rate limiting in addition to per-IP.

D. Observability & Error messages
- Prior generic client error message made debugging difficult. Server logs contain detailed error messages; recent change surfaces clearer message in response but care should be taken not to leak sensitive internals in production.

E. Internationalization & Locale handling
- preferredLanguage uses short codes ('en','ar','hi'). Cron/code that sends localized messages (e.g., src/lib/cron/reminders.ts) expects locales like 'en-US' in some places; ensure mapping between 'en' and BCP47 variants when formatting locale-dependent output.

F. Missing Tests / Coverage
- Tests exist for API preferences and schema but additional tests for LocalizationTab save flow (including error scenarios: validation failure, DB failure, rate limit) would improve confidence.

7 Concrete recommendations (prioritized)

Priority P0 (fix ASAP):
- Ensure server errors returned to client remain user-friendly but include an internal log with full stack (Sentry). Do not expose stack traces to client. (Server already logs; add Sentry capture in PUT catch path if not present.)
- Add explicit type coercion/sanitization on server for reminderHours (map to Number) before upsert to avoid Prisma type errors.
- Add client-side validation on LocalizationTab for preferredLanguage (guard allowed values) and ensure reminderHours are numbers.

Priority P1:
- Add tests covering LocalizationTab save: success, 400 validation error, 500 DB error, and 429 rate limit.
- Consider per-user write rate-limiting (in addition to per-IP) to avoid network-level collisions causing false positive rate limits.
- Add mapping utility to convert short language codes to BCP47 locales where external formatting APIs expect full locale strings (e.g., 'en' -> 'en-US'). Use a small map or Intl fallback.

Priority P2:
- Add an audit log entry on preferences updates (already present) with obfuscated payload (avoid storing PII in details). Confirm logs do not include secrets.
- Add opt-in admin tools to view per-user preferredLanguage/timezone for support scenarios (permission-gated).

8 Suggested code changes (concrete)

- Server: src/app/api/user/preferences/route.ts
  - Before upsert, coerce reminderHours values to numbers: reminderHours = reminderHours?.map(Number) filtered for valid numbers.
  - On validation failure (Zod), include which fields failed (but not raw values) in logs. Return generic "Invalid input" to client.
  - Capture exceptions via Sentry.captureException(e) with context: { tenantId, userId, payload: keysOnly }.

- Client: src/components/admin/profile/LocalizationTab.tsx
  - Validate preferredLanguage against VALID_LANGUAGES before calling updatePreferences.
  - Ensure reminderHours UI (if present) constructs numeric arrays (use parseInt) before send.
  - Improve UX: show inline error messages from server when validation fails instead of only toast.

- Hook: src/hooks/useUserPreferences.ts
  - When mutate rollback, use mutate(previousData, false) but consider `mutate(previousData, true)` to revalidate from server after rollback for consistency.

9 Action plan & next steps

1. Implement server-side reminderHours coercion and improved Sentry logging (P0) — I can implement this change if you want.
2. Add client-side validation for preferredLanguage and reminderHours (P0-P1).
3. Add unit/integration tests for LocalizationTab flow (P1).
4. Add mapping utility for preferredLanguage -> locale for cron/email code (P1).
5. Monitor logs post-change for any DB errors and iterate.

10 Appendices

A. Key code locations
- Localization UI: src/components/admin/profile/LocalizationTab.tsx
- Preferences hook: src/hooks/useUserPreferences.ts
- Preferences API: src/app/api/user/preferences/route.ts
- Schema: src/schemas/user-profile.ts
- Permissions: src/lib/permissions.ts
- DB model: prisma/schema.prisma (UserProfile)

B. Current permission facts
- No role-based permission required to update own localization preferences.
- Admin-level communication settings are gated by COMMUNICATION_SETTINGS_* and mapped in ROLE_PERMISSIONS: ADMIN and SUPER_ADMIN have all permissions; TEAM_LEAD and TEAM_MEMBER have some settings visibility permission (BOOKING_SETTINGS_VIEW etc.).

C. Example of health-check test to add (pseudo)
- Test: LocalizationTab saves and server updates timezone
  - Mock apiFetch to return 200 and updated JSON
  - Render LocalizationTab, change timezone, click Save
  - Expect toast success and SWR mutate called

---

If you want I can now implement the P0 server-side coercion for reminderHours and add Sentry capture in the PUT handler, plus update the client validation. Which would you like me to do next?
