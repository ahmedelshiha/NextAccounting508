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

## Phase 2 — Homepage Redesign (Weeks 3–4)
- [ ] Compact hero variant
  - What: components/home/compact-hero.tsx; feature-flag switch in app/page.tsx
- [x] Core services section
  - What: Already implemented (services-section.tsx)
- [x] Trust/testimonials
  - What: TrustSection + testimonials-section.tsx present
- [ ] Quick Wins section
  - What: components/home/quick-wins.tsx; CTA events wired to `trackEvent`
- [ ] Final CTA section
  - What: components/home/final-cta.tsx with risk-reversal CTA
- [ ] Optimized footer
  - What: components/ui/optimized-footer.tsx; replace Footer usage in layout/client layout

## Phase 3 — Client Portal Foundations (Weeks 5–8)
- [ ] Secure document upload UI
  - What: components/portal/secure-document-upload.tsx; post to /api/uploads; show categories & statuses
- [ ] Financial dashboard
  - What: components/portal/financial-dashboard.tsx; KPI + chart
- [ ] Message center
  - What: components/communication/message-center.tsx; wire to /api/portal/chat
- [ ] Tax deadline tracker
  - What: components/tax/deadline-tracker.tsx; reminders CTA

## Phase 4 — Advanced Features (Weeks 9–12)
- [ ] Expense tracking with receipt OCR (stub UI)
  - What: components/expenses/receipt-scanner.tsx; editable fields; save stub
- [ ] Automated billing sequences UI
  - What: components/invoicing/automated-billing.tsx; leverage payments APIs
- [ ] Compliance dashboard
  - What: components/compliance/compliance-dashboard.tsx
- [ ] Security Center dashboard
  - What: components/security/security-center.tsx (health, fraud, access log)
- [ ] Tools: Tax & ROI calculators
  - What: components/tools/{tax-calculator,roi-calculator}.tsx

## Conversion Optimization
- [ ] Conversion-optimized landing variant
  - What: components/landing/conversion-optimized.tsx; route /landing/variant-a via flag
- [ ] A/B testing hook
  - What: hooks/useABTest.ts; deterministic assignment; emit `ab_test_assigned`

## Analytics & Experimentation
- [ ] Event tracking utilities expansion
  - What: Type-safe event catalog; SSR-safe no-ops; GA/FB adapters
- [ ] Analytics ingestion API tests
  - What: Add vitest for validation, rate-limit, and audit logging paths

## Wiring & Integration
- [ ] Route integration
  - What: Import new homepage sections in app/page.tsx; replace footer in src/app/layout.tsx
- [ ] API stubs for new UIs
  - What: Minimal endpoints for calculators, billing sequences, security center summary
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
