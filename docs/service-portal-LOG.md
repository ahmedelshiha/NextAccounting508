# Service Portal — Change Log and Status

## CURRENT STATUS: READY FOR DEPLOY (as of 2025-09-21)
- Env vars confirmed set in Netlify and GitHub. Netlify build will run Prisma generate/migrate/seed via netlify.toml when triggered.

## Autonomous Pause Summary (2025-09-20)
- Dev env: runtime envs set via dev server (NETLIFY_DATABASE_URL, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NETLIFY_BLOBS_TOKEN, REALTIME_TRANSPORT, REALTIME_PG_URL, UPLOADS_PROVIDER, CRON_*).
- Next: Trigger Netlify/GitHub CI to run Prisma generate/migrate/seed; verify via /api/admin/permissions.

## Completed Work — Booking Context (Summary)
- Unified Service Requests APIs (admin/portal) with RBAC, realtime, CSV export, comments, tasks; legacy /api/bookings forwarder with deprecation headers.
- Admin & Portal availability endpoints added; portals query availability before confirm/reschedule.
- Appointment creation via unified payload (isBooking, scheduledAt, duration, bookingType) in admin and portal.
- Confirm/reschedule endpoints send ICS calendar invites when SENDGRID is configured.
- Booking type filters, scheduledAt ordering, analytics/KPIs, and CSV export columns in place.
- Booking preferences API and reminders cron endpoint/workflow implemented.
- Durable realtime transport (Postgres LISTEN/NOTIFY) behind flag; SSE clients wired across admin/portal.
- Prisma schema prepared for Phase 1 booking fields and related models; migrations staged for CI.

## Current Status Details
- Local dev: Prisma client generated and seed applied; dev-login and in-memory fallbacks available for smoke tests.
- CI/staging: Awaiting CI to run db generate/migrate/seed against Neon using NETLIFY_DATABASE_URL; DATABASE_URL to be set in GitHub secrets.
- Realtime/uploads: Postgres adapter implemented; Netlify Blobs provider integrated; enable via envs.

## Notes & Operational Reminders
- Required envs must be present in Netlify and GitHub (DATABASE_URL, NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID).
- Prefer CI-based migrations to avoid schema drift between environments.

## Reference Plan
- Booking enhancement plan: [docs/booking_enhancement_plan.md](./booking_enhancement_plan.md)

---

## 2025-09-20 — AvailabilityEngine implemented
- Added src/lib/booking/availability.ts with business-hours, weekend skipping, booking buffers, daily caps, and deterministic now option.
- Refactored admin and portal availability routes to use the engine with DB-backed conflicts and graceful fallbacks when DB unavailable.
- Added unit tests (tests/availability.engine.test.ts) covering buffers, overlaps, weekend skipping, and daily caps — all passing.
- Next: integrate blackout dates once Phase 1 schema is deployed; wire engine into multi-step booking wizard and pricing pipeline.

## 2025-09-20 — PricingEngine implemented
- Added src/lib/booking/pricing.ts supporting weekend/peak surcharges, duration overage (pro-rata), emergency surcharge, promo resolver, and currency conversion.
- Integrated optional pricing into availability endpoints via includePrice and currency query params; returns priceCents and currency per slot.
- Added tests (tests/pricing.engine.test.ts) — all passing. Updated availability tests to include compatibility change (all slots returned with available flag).
- Next: surface pricing in Booking Wizard UI and add admin-configurable pricing settings.

## 2025-09-21 — Server-side pricing in availability + UI
- Enhanced /api/bookings/availability to support includePrice and currency; slots may include { priceCents, currency }.
- BookingWizard now requests includePrice and shows server-priced totals in the summary for the selected time.
- Why: ensure accurate, policy-aware pricing per slot (weekend/peak/overage) and reduce client-side logic.
- Next: Reuse wizard in portal create flow.

## 2025-09-21 — TouchCalendar + currency/promo in BookingWizard
- Added src/components/mobile/TouchCalendar.tsx and integrated in DateTime step (mobile view) while keeping native date input.
- BookingWizard now supports currency selection (from /api/currencies) and promo codes (WELCOME10, SAVE15) reflected in slot pricing.
- Availability API enhanced to accept promoCode and apply discounts via promoResolver.
- Why: improve mobile UX and pricing flexibility; align with internationalization goals.
- Next: responsive/unit tests, keyboard a11y for calendar, portal integration.

## 2025-09-21 — Portal booking create flow reuses BookingWizard
- Added /portal/bookings/new using BookingWizard with consistent portal styling and back link.
- Updated portal bookings list to include a New Appointment button and empty-state CTA to the new page.
- Why: unify booking creation UX across public and portal; reduce maintenance surface.
- Next: add tests for API includePrice and BookingWizard flow; accessibility tests for TouchCalendar.

## 2025-09-21 — Conflict detection service + 409 enforcement
- Added src/lib/booking/conflict-detection.ts with buffer-aware overlap checks and daily cap enforcement.
- Enforced conflict checks in admin/portal create (booking) and reschedule endpoints; now respond with HTTP 409 on conflicts instead of 400.
- Why: ensure deterministic conflict handling and API compatibility guarantees noted in roadmap.
- Tests: added route tests for portal/admin create/reschedule conflict scenarios returning 409.

## 2025-09-21 — Recurring bookings planner (library)
- Added src/lib/booking/recurring.ts to generate occurrences and preflight conflict checks for recurring patterns (daily/weekly/monthly).
- Why: groundwork for recurring bookings P1; enables UI/API to preview conflicts and skip with logs.
- Next: wire into API when Phase 1 schema lands; provide client-side UI for pattern configuration.

## 2025-09-21 — Recurring bookings: API integration
- Added recurringPattern support to admin and portal create routes.
- Creates a parent record and non-conflicting child appointments; skips conflicts and logs them as comments on the parent; returns planning details in the response.
- Why: completes P1 recurring foundation and aligns API with schema (recurringPattern, parentBookingId).

## 2025-09-21 — Recurring preview endpoints
- Added POST /api/admin/service-requests/recurring/preview and /api/portal/service-requests/recurring/preview.
- Returns conflict-aware plan via planner; falls back to naive plan when DB is not configured; includes summary totals.
- Why: enables UI to preview series before creation and surface skipped/conflicting occurrences.

## 2025-09-21 — Seed enhancements (demo data)
- Created/ensured demo users (admin, staff, team lead, client1@example.com, client2@example.com).
- Seeded services, posts (as before), plus team members linked to staff/lead, assigned sample service requests, and created linked demo bookings.
- Assigned sample tasks and linked them to demo service requests via RequestTask.
- Updated login page to list Client 1 and Client 2 demo accounts.
