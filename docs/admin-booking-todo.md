# Admin Booking Settings — Implementation TODO (Next.js + Prisma + Netlify)

Goal: Ship a production-grade Booking Settings module (admin) with RBAC, audit logging, import/export, and a clean UI, leveraging Next.js App Router, Prisma (Postgres on Netlify), and existing project patterns.


## Status Update

- Completed: Prisma models, Types, Service layer (CRUD/validation/import/export/reset), API endpoints, RBAC permissions/mapping, BookingSettingsPanel UI, Booking Settings page wrapper, caching with invalidation, Vitest tests (service + API including RBAC).
- Why: Provide a fully functional, secure, and performant admin module with automated coverage, ready for QA and deployment.
- Next: Add UI component tests within current static test harness constraints; perform admin QA; verify Netlify envs/build.


## 0) Current State Audit

- Prisma schema includes BookingSettings and related models.
- API routes under `src/app/api/admin/booking-settings/*` implemented.
- `src/services/booking-settings.service.ts` implemented with validation and caching.
- `src/types/booking-settings.types.ts` present.
- Admin settings subpage created at `src/app/admin/settings/booking/page.tsx` and Panel at `src/components/admin/BookingSettingsPanel.tsx`.
- Permissions include booking-specific keys (see `src/lib/permissions.ts`).
- Netlify + Next.js + Prisma infrastructure configured.


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
- [x] API tests: happy-path and RBAC (unauthorized cases for CLIENT/TEAM_LEAD, admin reset/export success).
- [ ] Component tests: static render covered. Note: current test harness renders static markup only (no effects/handlers), limiting interactive flow tests (save/export/reset). To expand, we would need a DOM-capable renderer; out of scope for now.

## 9) Netlify & Ops

- [ ] Ensure `NETLIFY_DATABASE_URL` and NextAuth envs are set in Netlify settings.
- [ ] Confirm `@netlify/plugin-nextjs` builds API routes in `netlify.toml`.
- [ ] Build pipeline passes lint, typecheck, and build scripts in `package.json`.

## 10) Rollout Plan

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
