# E2E Test Plan — Booking → Invoice → Payment Flow

Purpose: End-to-end tests to validate the critical financial flow: create a booking as admin, create an invoice for that booking, and complete a payment (sandbox). These tests run against a deployed test instance or local dev server.

Prerequisites
- A staging or local environment reachable from the test runner (E2E_BASE_URL).
- Test admin credentials or a mechanism to obtain an admin auth token (ADMIN_AUTH_TOKEN or a dev login route).
- Stripe test account configured for staging; webhook delivery is not required for these tests if payments are simulated.

Environment variables
- E2E_BASE_URL (e.g. https://staging.example.com) — default: http://localhost:3000
- ADMIN_AUTH_TOKEN — bearer token or cookie for admin requests (optional if using dev-login)
- STRIPE_TEST_MODE (optional) — set to "true" if hitting live Stripe sandbox endpoints

High-level flow
1. Create booking via POST /api/admin/bookings (admin auth) with serviceId and scheduledAt.
2. Create invoice for booking via POST /api/admin/invoices (admin auth) referencing booking id.
3. Simulate payment (either by calling test-only payment endpoint or by creating a Stripe PaymentIntent and marking invoice paid via API).
4. Assert invoice status is PAID and booking/invoice records are consistent.

Failure handling & cleanup
- Tests must attempt to clean up created bookings/invoices when possible.
- If cleanup is impossible (3rd party side effects), tag created records with a test-prefixed metadata key so they can be cleaned up later.

Running locally
- Install Playwright: pnpm add -D @playwright/test
- Export E2E_BASE_URL and ADMIN_AUTH_TOKEN (if needed)
- Run: pnpm test:e2e

Notes
- This repo includes a vitest-based integration test harness; the E2E scaffold uses Playwright for realistic browser interactions and flow coverage.
- If Playwright cannot be installed in CI, these tests can run from a developer machine targeting staging.
