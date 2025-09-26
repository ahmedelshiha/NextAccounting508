# Accounting Website Redesign — Execution Plan (Aligned with Codebase Audit)

Audited: routes, components, and APIs under src/app, src/components, src/lib. Checked homepage, uploads, portal, admin, payments, newsletter, and security utilities.

## ✅ Completed
- [x] Resolve install failure and generate Prisma client
  - What: Ran `pnpm install --no-frozen-lockfile` and `pnpm db:generate`; dev server on :3000
  - Why: Unblocked development; Prisma client ready
- [x] Homepage assembled with current sections
  - What: app/page.tsx uses Hero, Services, Trust, Testimonials, Blog
  - Why: Confirms baseline UX before enhancements
  - Next: Add Quick Wins + Final CTA
- [x] Rate limiting foundation present and applied across APIs
  - What: Verified and left in place; extended plan for uncovered endpoints
  - Why: Prevent abuse/DoS; align with security priorities
- [x] Secure uploads API with AV scanning
  - What: src/app/api/uploads/route.ts enforces type/size + optional ClamAV; persists attachments
  - Why: Protects users and infra from malicious files
  - Next: Build portal UI + quarantine flow
- [x] Payments foundation
  - What: checkout/webhook endpoints exist under src/app/api/payments/*
  - Why: Enables billing features to build upon
- [x] Central auth helper created
  - What: Added src/lib/auth-middleware.ts with `requireAuth(roles?)` + `isResponse`
  - Why: Consistent 401/403 handling; reduces duplication
  - Next: Gradually refactor targeted routes to use it
- [x] Protect newsletter API + add rate limits
  - What: Updated src/app/api/newsletter/route.ts — GET requires ADMIN/STAFF; POST/GET rate-limited
  - Why: Prevent scraping/abuse; restrict sensitive data
- [x] Security headers (CSP report-only)
  - What: Added global headers in next.config.mjs (X-CTO, XFO, Referrer-Policy, Permissions-Policy, CSP-RO)
  - Why: Harden responses without breaking scripts; plan iterative tightening
- [x] Analytics ingestion API
  - What: Created src/app/api/analytics/track/route.ts with Zod validation + rate limit + audit logging
  - Why: Server-side capture for key events and experiments
- [x] Frontend trackEvent utility
  - What: Extended src/lib/analytics.ts with `trackEvent(event, properties)` posting to /api/analytics/track
  - Why: Consistent client event pipeline (GA/FB/Custom)
- [x] Quick Wins section implemented and wired
  - What: src/components/home/quick-wins.tsx; inserted into app/page.tsx; CTA events tracked
  - Why: Drives immediate value and engagement
- [x] Final CTA section implemented
  - What: src/components/home/final-cta.tsx; inserted into app/page.tsx; tracks consultation requests
  - Why: Improves conversion with strong risk-reversal CTA
- [x] Optimized footer added and integrated
  - What: src/components/ui/optimized-footer.tsx; swapped in client layout
  - Why: Smaller DOM footprint with same brand look; newsletter/social preserved

## Phase 2 — Homepage Redesign (Weeks 3–4)
- [x] Compact hero variant
  - What: Implemented src/components/home/compact-hero.tsx and feature flag in app/page.tsx using searchParams (?hero=compact) and cookie (hero=compact)
  - Why: Provide a faster LCP alternative for experimentation while preserving brand look and feel
  - Next: Run A/B via query param initially; consider server-assigned flag and analytics segmentation
  - What: components/home/compact-hero.tsx; feature-flag switch in app/page.tsx
- [x] Core services section
  - What: Already implemented (services-section.tsx)
- [x] Trust/testimonials
  - What: TrustSection + testimonials-section.tsx present

## Phase 3 — Client Portal Foundations (Weeks 5–8)
- [x] Secure document upload UI
  - What: Added src/components/portal/secure-document-upload.tsx and integrated into portal page; posts multipart/form-data to /api/uploads with category-as-folder, progress, and per-file status
  - Why: Enable clients to submit documents securely with AV scanning and clear feedback
  - Next: Add attachments listing API and UI to show persisted history across sessions
- [x] Financial dashboard
  - What: Implemented src/components/portal/financial-dashboard.tsx; KPIs (upcoming count, upcoming value, last 30 days) and monthly booked value chart; integrated into portal page using existing bookings data
  - Why: Give clients a clear snapshot of upcoming commitments and recent activity
  - Next: Extend with invoices/payments once API available for client-level billing
- [x] Message center
  - What: Implemented src/components/communication/message-center.tsx; wired to /api/portal/chat with SSE updates; integrated into portal page
  - Why: Provide clients an in-portal communication hub with real-time delivery and offline queue fallback
  - Next: Add admin view parity and typing indicators
- [x] Tax deadline tracker
  - What: Implemented src/components/tax/deadline-tracker.tsx; shows next federal deadlines with dates; CTAs to enable reminders and view calendar; integrated into portal page
  - Why: Keep clients ahead of critical filing/payment dates
  - Next: Localize per country/state and personalize based on entity type

## Phase 4 — Advanced Features (Weeks 9–12)
- [ ] Expense tracking with receipt OCR (stub UI)
  - What: src/components/expenses/receipt-scanner.tsx; editable fields; save stub
- [ ] Automated billing sequences UI
  - What: src/components/invoicing/automated-billing.tsx; leverage payments APIs
- [ ] Compliance dashboard
  - What: src/components/compliance/compliance-dashboard.tsx
- [ ] Security Center dashboard
  - What: src/components/security/security-center.tsx (health, fraud, access log)
- [x] Tools: Tax & ROI calculators
  - What: Implemented src/components/tools/tax-calculator.tsx and src/components/tools/roi-calculator.tsx; wired into /resources/tools

## Conversion Optimization
- [x] Conversion-optimized landing variant
  - What: Added src/app/landing/variant-a/page.tsx with optimized hero + pricing; tracks events
- [x] A/B testing hook
  - What: Implemented src/hooks/useABTest.ts with deterministic cookie-based assignment and ?ab override; emits `ab_test_assigned`

## Analytics & Experimentation
- [x] Event tracking utilities expansion
  - What: Expanded src/lib/analytics.ts with typed event catalog and SSR-safe adapters (GA/FB + server ingestion)
- [x] Analytics ingestion API tests
  - What: Added tests/analytics.track.route.test.ts covering valid payload, invalid payload, payload too large (413), and rate limit (429) via mocks

## Wiring & Integration
- [x] Route integration for remaining features
  - What: Integrated FinancialDashboard, MessageCenter, DeadlineTracker into portal; exposed calculators/tools at /resources/tools
- [x] API stubs for new UIs
  - What: Implemented src/app/api/tools/tax/route.ts and src/app/api/tools/roi/route.ts with Zod validation and computed responses
- [ ] Accessibility pass
  - What: aria labels; focus order; contrast checks; Lighthouse a11y ≥ 95

## QA & Performance
- [ ] E2E coverage
  - What: Playwright flows: homepage (incl. variant), upload, calculators, portal dashboard, chat
- [ ] Perf budget
  - What: Bundle budgets; LCP < 2.5s, CLS < 0.1 on homepage median

---

## Notes
- Preserve existing styles/variables; add styles via Tailwind classes consistent with current design.
- No placeholders; all stubs return explicit sample payloads with validation and limits.

---

## Next Actions — Ordered Backlog (with Checkboxes)

1) Expense Tracking (Stub UI)
- [x] Create src/components/expenses/receipt-scanner.tsx with file input, preview, editable extracted fields, and save stub
- [x] Add route integration into src/app/portal/page.tsx (card linking to receipt scanner)
- [x] Add server stub endpoint src/app/api/expenses/ingest/route.ts (validates payload, returns stored-id)
- [x] Track events: receipt_opened, receipt_saved (src/lib/analytics.ts)
- [ ] Unit tests for parser utilities (if any) under tests/expenses

Status:
- Completed: Receipt scanner UI, ingest API, portal link, analytics events
- Why: Enables clients to quickly capture expenses; prepares for future OCR and storage integration without blocking on provider setup
- Next: Add unit tests for extract helper; later wire to uploads provider + DB persistence

2) Automated Billing Sequences UI
- [ ] Create src/components/invoicing/automated-billing.tsx (sequence builder, schedule preview, status chips)
- [ ] Surface component in src/app/admin/invoices/page.tsx (tabs or section)
- [ ] Wire to existing payments APIs (mock until finalized); create src/app/api/invoicing/sequences/route.ts stub
- [ ] Events: billing_sequence_created/updated
- [ ] Snapshot tests for UI building blocks under tests/invoicing

3) Compliance Dashboard
- [ ] Create src/components/compliance/compliance-dashboard.tsx (widgets: filings due, KYC/KYB status, alerts)
- [ ] Add admin route surface in src/app/admin/analytics/page.tsx or dedicated admin/compliance/page.tsx
- [ ] Server API stub: src/app/api/compliance/overview/route.ts with sample data
- [ ] Events: compliance_viewed, alert_dismissed

4) Security Center Dashboard
- [ ] Create src/components/security/security-center.tsx (health checks, fraud signals, access log)
- [ ] Admin route: src/app/admin/security/page.tsx
- [ ] Server API stubs: src/app/api/security/health/route.ts, src/app/api/security/events/route.ts
- [ ] Events: security_center_viewed

5) Accessibility Pass (Target ≥ 95 Lighthouse)
- [ ] Audit interactive components in src/components/ui/* for aria-labels, roles, focus order
- [ ] Ensure color contrast on key pages: src/app/page.tsx, src/app/portal/page.tsx, src/app/admin/page.tsx
- [ ] Add skip-to-content link in src/app/layout.tsx
- [ ] Validate headings hierarchy and form labels in forms/* and booking/*
- [ ] Add tests using @playwright/axe for a11y smoke

6) E2E Coverage (Playwright)
- [ ] Homepage (default + ?hero=compact)
- [ ] Upload flow (portal): happy path + AV rejection
- [ ] Calculators (tax, ROI): input → result snapshot
- [ ] Portal dashboard: KPIs render
- [ ] Chat: message send/receive (mock SSE)

7) Performance Budgets
- [ ] Validate LCP/CLS on homepage using Playwright traces
- [ ] Enforce budgets via tests/thresholds.test.ts and CI
- [ ] Identify top bundles via next build stats and set per-chunk limits

---

## Status Updates Format (to be maintained)
- What was completed
- Why it was done
- Next steps (if any)
