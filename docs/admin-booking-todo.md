# Admin Booking Settings — Implementation TODO (Next.js + Prisma + Netlify)

Goal: Ship a production-grade Booking Settings module (admin) with RBAC, audit logging, import/export, and a clean UI, leveraging Next.js App Router, Prisma (Postgres on Netlify), and existing project patterns.


## Status Update

- Completed: Prisma models, Types, Service layer (CRUD/validation/import/export/reset), API endpoints, RBAC permissions/mapping, BookingSettingsPanel UI, Booking Settings page wrapper, caching with invalidation, initial Vitest tests (service + API basics).
- Why: Provide a fully functional, secure, and performant admin module with growing automated coverage, ready for QA and deployment.
- Next: Expand API tests (auth/RBAC), add component tests for the panel, run admin QA, verify Netlify envs/build.


## 0) Current State Audit

- Prisma schema includes BookingSettings and related models.
- API routes under `src/app/api/admin/booking-settings/*` implemented.
- `src/services/booking-settings.service.ts` implemented with validation and caching.
- `src/types/booking-settings.types.ts` present.
- Admin settings subpage created at `src/app/admin/settings/booking/page.tsx` and Panel at `src/components/admin/BookingSettingsPanel.tsx`.
- Permissions include booking-specific keys (see `src/lib/permissions.ts`).
- Netlify + Next.js + Prisma infrastructure configured.


## 1) Data Model (Prisma) — add models and indexes

Migration checklist:
- [x] Add models to `prisma/schema.prisma`.
- [x] Run `pnpm db:generate`.
- [x] Run `pnpm db:push` (or migrate deploy).
- [x] Verify tables and indexes exist in Prisma Studio.


## 2) Types

- [x] Define all interfaces and export payload types.
- [x] Export enums/unions.
- [x] Ensure numeric ranges and optionality match defaults.


## 3) Service Layer

- [x] getBookingSettings(orgId) including relations.
- [x] createDefaultSettings(orgId) seed defaults transactionally.
- [x] updateBookingSettings(orgId, updates) with validation and merge.
- [x] updateBookingSteps/settings/business-hours/payment-methods.
- [x] export/import/reset.
- [x] Emit audit logs for mutations.
- [x] Cache resolved settings by tenant with TTL; invalidate on mutations.


## 4) API Endpoints (Next.js App Router)

- [x] `route.ts` GET/PUT with validation and audit.
- [x] `steps/route.ts` PUT.
- [x] `business-hours/route.ts` PUT.
- [x] `payment-methods/route.ts` PUT.
- [x] `export/route.ts` GET.
- [x] `import/route.ts` POST.
- [x] `reset/route.ts` POST.
- [x] `validate/route.ts` POST.


## 5) RBAC

- [x] Add: BOOKING_SETTINGS_VIEW/EDIT/EXPORT/IMPORT/RESET.
- [x] Map to ADMIN (all) and TEAM_LEAD (VIEW, EDIT, EXPORT).
- [x] Verify usage across endpoints.


## 6) UI — Admin Panel

- [x] `src/components/admin/BookingSettingsPanel.tsx` (tabbed UI with save/reset/export + validation errors).
- [x] `src/app/admin/settings/booking/page.tsx` wrapper using PermissionGate.


## 7) Caching & Defaults

- [x] Cache resolved settings by `tenantId` with TTL (300s) using `src/lib/cache.service.ts`.
- [x] Invalidate cache on update/import/reset and per-section updates.
- [x] Auto-create defaults on missing GET.


## 8) Testing (Vitest)

- [x] Service tests: validation cases, transactions, defaults, import/export, reset, caching behavior.
- [ ] API tests: auth failures, RBAC, happy-path, validation errors, export/import/reset (basic happy-path added; expand coverage).
- [ ] Component tests: panel rendering, toggles, save flow, export download, reset flow.


## 9) Netlify & Ops

- [ ] Ensure `NETLIFY_DATABASE_URL` and NextAuth envs are set in Netlify settings.
- [ ] Confirm `@netlify/plugin-nextjs` builds API routes in `netlify.toml`.
- [ ] Build pipeline passes lint, typecheck, and build scripts in `package.json`.


## 10) Rollout Plan (dependency-ordered)

- [x] Prisma models + migration
- [x] Types file
- [x] Service layer (+ caching)
- [x] API routes
- [x] RBAC keys/mapping
- [x] UI page + component
- [x] Caching + invalidation
- [/] Vitest tests (service complete; API partial; UI pending)
- [ ] Admin QA
- [ ] Netlify deploy
