# Admin Services Module – Enhancement Plan

This plan sequences tasks by dependencies, with clear, measurable outcomes. We will track progress with checkboxes and keep this file current.

## Phase 1 — Foundations (types, schemas, utils, hooks, service layer, APIs)
- [ ] Define Services domain types
- [ ] Add Zod schemas for validation (create/update/filters)
- [ ] Implement utilities (slug, sanitize, filters/sorts, metrics, bulk validation)
- [ ] Add debounce hook and permissions hook
- [ ] Add cache and notification service (graceful no-op if not configured)
- [ ] Implement ServicesService (business layer) using Prisma and multi-tenant safety
- [ ] Add admin APIs: list/create, get/update/delete, bulk, stats, export
- [ ] Extend permissions to include services.* and update role mapping
- [ ] Smoke test: create/list/update/delete/bulk/export

## Phase 2 — UI Components (modular, reusable, accessible)
- [ ] ServicesHeader with stats, search, actions
- [ ] ServicesFilters with category/status/featured
- [ ] ServiceCard (grid) and simple table view
- [ ] ServiceForm with RHF + Zod
- [ ] BulkActionsPanel (validate and confirm)
- [ ] ServicesAnalytics (key KPIs + light charts)
- [ ] Wire EnhancedServicesPage to new components and hooks

## Phase 3 — Integration & Migration
- [ ] Keep existing /api/services endpoints; introduce /api/admin/services for admin UX
- [ ] Gradually migrate src/app/admin/services/page.tsx to new components/hooks
- [ ] Preserve existing styles and breakpoints
- [ ] Backward compatibility for demo/no-DB mode

## Phase 4 — Hardening & Ops
- [ ] Permission guards on server and client
- [ ] Rate limiting for list/create/update
- [ ] Audit logging for CRUD and bulk
- [ ] CSV export headers and filename conventions
- [ ] Error surfaces with user-friendly toasts
- [ ] Netlify-specific headers/cache controls

## Phase 5 — Deployment Readiness
- [ ] Typecheck, lint, build clean
- [ ] E2E smoke on Netlify preview
- [ ] Rollback strategy and feature toggles

---

## Work Log (running)
- After each commit, update docs/admin-services-todo.md with what/why/next.
