# Redundancy Cleanup & Consolidation — Pending Tasks

This file captures the pending tasks related to the current effort (auth/session + tenant context stabilization and test-suite cleanup) so they can be tracked and acted on.

## Summary (current state)
- Several auth/session and tenant-context fixes were implemented (tenant-context AsyncLocalStorage polyfill, vitest auth mocks enriched, NEXTAUTH_SECRET added, resilient permissions/auth mocks).
- The full test suite was run; many tests pass but a number of integration and API tests fail with authorization (401) mismatches and a few UI tests that rely on module mocks.

---

## Pending tasks

1) Run full test suite and triage remaining failures
- Status: pending
- Rationale: Identify failing tests (API 401s, AdminSidebar/AdminDashboardLayout UI tests, auth.session-callback variations) and group by root cause.
- Steps:
  - Run tests single-threaded (ensure vitest.setup.ts loads before test-level mocks) and capture failing files.
  - For each failing test file, collect error output and stack traces.
  - Classify failures into categories: (a) auth/session not picked up by api-wrapper, (b) tenant-context missing in async flows, (c) module-mock collisions (global vs per-test mocks), (d) real DB/env side-effects.
  - Triage highest-impact failures first (authorization 401s for admin endpoints).
- Owner: Engineering
- Priority: High

2) Stabilize global mocks or triage individual failing tests (decide approach)
- Status: pending
- Rationale: Some tests call vi.mock/vi.doMock at test scope; global mocks in vitest.setup.ts can interfere. Decide between:
  - Approach A: Keep minimal, non-invasive global mocks and let tests provide per-file mocks; or
  - Approach B: Maintain richer global mocks but ensure the api-wrapper and auth helper imports always respect test-local mocks.
- Steps:
  - Audit vitest.setup.ts global mocks; ensure they are permissive and fall back cleanly if tests override modules.
  - Update api-wrapper to consistently resolve test-local getServerSession (prefer 'next-auth' when present, fallback to '@/lib/auth').
  - Where tests use vi.doMock('next-auth'), verify that the mock location and import path are consistent with runtime resolution.
  - Add small helper utilities for tests to set session context explicitly (if helpful) to avoid repeated vi.doMock usage.
- Owner: Engineering
- Priority: High

---

## Follow-up actions (after pending tasks are completed)
- Re-run full suite until green or until failures are limited and actionable.
- For any persistent failures related to DB or environment variables, document required MCP connections (e.g., Neon or Supabase) or test data setup steps.
- Create small, targeted PRs for each root cause fix (auth/api-wrapper, tenant-context, vitest.setup adjustments, permission module fallbacks).

---

## Notes and context
- Current vitest.setup.ts changes already include:
  - NEXTAUTH_SECRET set for tests
  - defaultSession enriched with tenant metadata
  - resilient '@/lib/auth' and '@/lib/permissions' fallbacks
  - api-wrapper updated to prefer importing 'next-auth' so per-test vi.doMock('next-auth') is honored
- The top-level priority is to ensure API routes that rely on withTenantContext and getSessionOrBypass pick up the test-provided session value instead of returning 401.

If you want, I can now:
- Run the full test suite and produce a file-by-file failing report, or
- Start implementing the first triage item (ensure api-wrapper reliably picks up test-local next-auth mocks) and run failing tests iteratively.

