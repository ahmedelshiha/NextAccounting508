Localization Tab — Comprehensive Audit Report

Last updated: 2025-10-21
Author: Automated audit (assistant)

1. Executive summary

The Localization tab (src/components/admin/profile/LocalizationTab.tsx) lets users set timezone and preferred language. Users reported "Failed to update preferences" when saving. This audit inspects the UI, client hook, API route, schemas, and DB interactions to identify likely causes and provide remediation recommendations.

2. Files inspected

- UI component: src/components/admin/profile/LocalizationTab.tsx
- Client hook: src/hooks/useUserPreferences.ts
- API route: src/app/api/user/preferences/route.ts
- Schemas & helpers: src/schemas/user-profile.ts
- Constants: src/components/admin/profile/constants.ts
- Network helper: src/lib/api.ts
- Prisma model: prisma/schema.prisma

3. Reproduction steps

1. Open Manage profile -> Localization tab
2. Change Timezone or Preferred Language
3. Click Save
4. Observe toast: "Failed to update preferences"
5. Check browser console/network and server logs for route errors (PUT /api/user/preferences)

4. Observations & Findings

A. Client/UI
- LocalizationTab validates timezone client-side via isValidTimezone before setting state.
- It calls updatePreferences(data) from useUserPreferences which performs optimistic update and calls PUT /api/user/preferences.
- UI shows generic toast on error; no intermediate diagnostics.

B. Hook (useUserPreferences)
- fetchPreferences uses apiFetch('/api/user/preferences'). On server 500 it returns PreferencesSchema.parse({}) defaults.
- updatePreferences constructs optimisticData and calls apiFetch('/api/user/preferences', { method: 'PUT', body: JSON.stringify(newPreferences) })
- If server responds non-ok, hook throws an Error with errorData.error or generic message; it then mutates rollback and rethrows.
- Potential issue: mutate(previousData, false) runs with stale previousData if data changed between render and call (but not likely root cause here).

C. API (src/app/api/user/preferences/route.ts)
- GET: returns preferences from prisma.user.userProfile; robust fallback to schema defaults on DB-not-configured.
- PUT: validates body with PreferencesSchema.safeParse(). Also re-validates timezone with isValidTimezone(). Then finds user by email & tenant and upserts userProfile with the validated fields.
- Errors: route returns standardized error JSON. Previously returned generic message; audit code updated server to include more informative message for debugging.
- Rate limiting applied for writes (20/min) per IP; could cause 429 if hit.

D. Schema & helpers
- PreferencesSchema covers timezone, preferredLanguage, booking preferences, and reminderHours. Preferences Zod schema defaults are present.
- isValidTimezone uses Intl.DateTimeFormat and a fallback list; getCommonTimezones provides timezone options used by UI.

E. DB / Prisma
- userProfile.upsert updates reminderHours (Int[]). If client sends reminderHours as strings or malformed arrays, Prisma may throw constraint/type errors.
- Prisma schema shows userProfile.reminderHours is Int[] with default [24,2]. If client accidentally sends e.g. string '[
