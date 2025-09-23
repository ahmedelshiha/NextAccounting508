# Admin Booking Settings — Implementation TODO (Next.js + Prisma + Netlify)

Goal: Ship a production-grade Booking Settings module (admin) with RBAC, audit logging, import/export, and a clean UI, leveraging Next.js App Router, Prisma (Postgres on Netlify), and existing project patterns.


## Status Update

- Completed: Prisma models, Types, Service layer (CRUD/validation/import/export/reset), API endpoints, RBAC permissions/mapping, BookingSettingsPanel UI, Booking Settings page wrapper, caching with invalidation, Vitest tests (service + API incl. RBAC), extended RBAC tests for TEAM_LEAD (GET/PUT allowed; IMPORT/RESET denied), Netlify config verification.
- Why: Provide a fully functional, secure, and performant admin module with automated coverage, ready for QA and deployment.
- Next: Admin QA automation (CRUD, steps, hours, payments, export/import/reset), finalize Netlify envs, optional UI interactive tests (DOM-capable renderer).


## 0) Current State Audit

- Prisma schema includes BookingSettings and related models.
- API routes under `src/app/api/admin/booking-settings/*` implemented.
- `src/services/booking-settings.service.ts` implemented with validation and caching.
- `src/types/booking-settings.types.ts` present.
- Admin settings subpage created at `src/app/admin/settings/booking/page.tsx` and Panel at `src/components/admin/BookingSettingsPanel.tsx`.
- Permissions include booking-specific keys (see `src/lib/permissions.ts`).
- Netlify `netlify.toml` present with `@netlify/plugin-nextjs` and guarded Prisma migrate/seed steps.


## 1) Data Model (Prisma)

- [x] Models added and pushed.

## 2) Types

- [x] Interfaces and unions defined.

## 3) Service Layer

- [x] All operations + validation + caching/invalidation.

## 4) API Endpoints (App Router)

- [x] GET/PUT + steps + business-hours + payment-methods + export + import + reset + validate.

## 5) RBAC

- [x] Permissions and role mapping; endpoint checks.

## 6) UI — Admin Panel

- [x] Panel and page wrapper implemented.

## 7) Caching & Defaults

- [x] Tenant-scoped cache with TTL; invalidation on mutations; auto-defaults.

## 8) Testing (Vitest)

- [x] Service tests: validation, defaults, updates, export/import/reset, caching.
- [x] API tests: happy-path and RBAC (CLIENT unauthorized; TEAM_LEAD GET/PUT allowed, IMPORT/RESET denied; ADMIN reset/export success).
- [ ] Component tests: static render covered. Interactive flows (save/export/reset) require a DOM-capable renderer; out of scope for now.

## 9) Netlify & Ops

- [x] netlify.toml verified: build runs Prisma generate, guarded migrate/seed, lint, build; plugin `@netlify/plugin-nextjs` included; publish `.next`.
- [ ] Set environment variables in Netlify → Site settings → Build & deploy → Environment:
  - NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_UNPOOLED
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - SENDGRID_API_KEY
  - FROM_EMAIL
  - CRON_SECRET
  - PRISMA_MIGRATION_ENGINE_ADVISORY_LOCK_TIMEOUT=300000
  - SENTRY_SUPPRESS_TURBOPACK_WARNING=1
- [ ] Trigger production build; confirm deploy success and serverless functions availability.

## 10) Admin QA Checklist (Booking Settings)

- Authentication & RBAC
  - [ ] CLIENT cannot access /api/admin/booking-settings (401)
  - [ ] TEAM_LEAD can GET/PUT, cannot IMPORT/RESET (401)
  - [ ] ADMIN full access
- Settings CRUD
  - [ ] GET creates defaults when missing; UI loads
  - [ ] Update general (requireApproval) persists and reflects on reload
  - [ ] PaymentRequired=true requires at least one method (validation error shown)
  - [ ] Deposit percentage invalid range rejected (10–100)
- Steps & Hours & Payments
  - [ ] Replace steps via API and confirm order
  - [ ] Replace business hours and confirm UI reflects
  - [ ] Upsert payment methods (CARD, CASH)
- Import/Export/Reset
  - [ ] Export JSON downloads with version=1.0.0
  - [ ] Import selected sections with overwrite
  - [ ] Reset restores defaults
- Notifications & Assignment & Pricing
  - [ ] Reminder hours accept 0–8760 only
  - [ ] Assignment strategy changes persist
  - [ ] Surcharge fields accept 0–2 only (0–200%)

## 11) Rollout Plan

- [x] Prisma models + migration
- [x] Types file
- [x] Service layer (+ caching)
- [x] API routes
- [x] RBAC keys/mapping
- [x] UI page + component
- [x] Caching + invalidation
- [x] Vitest tests (service + API RBAC)
- [ ] UI tests (static done; interactive pending)
- [ ] Admin QA
- [ ] Netlify deploy
