# Service Portal — Change Log and Status

## CURRENT STATUS: PAUSED (as of 2025-09-20)
- Paused pending CI-run Prisma migrations/seeds, staging configuration, and multi-tenancy rollout planning.

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

## 2025-09-21 — Multi-step Booking Wizard (UI) implemented
- Added src/components/booking/BookingWizard.tsx and refactored src/app/booking/page.tsx to use it.
- Implemented steps: service selection, date/time with availability, client info, and confirmation with summary.
- Pricing: displays base price from service and prepares interfaces to integrate PricingEngine (server-side) via includePrice.
- Why: create a reusable, production-ready booking flow for both public and portal use; improves maintainability and UX.
- Next: wire wizard into portal create flow, add TouchCalendar for mobile, and implement server-side pricing in availability API.
