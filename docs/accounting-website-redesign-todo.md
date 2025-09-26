# Accounting Website Redesign — Execution Plan

This plan is derived from docs/accounting-website-redesign.md and ordered by dependencies. Each task is specific, measurable, and outcome‑oriented.

## ✅ Completed
- [x] Resolve install failure and generate Prisma client
  - What: Ran `pnpm install --no-frozen-lockfile` and `pnpm db:generate`; started dev server on :3000
  - Why: Unblocked local development and ensured Prisma client is generated for all APIs
  - Next: Keep `pnpm` as package manager and run `pnpm db:generate` after schema changes

## Phase 1 — Security & Core Protections (Weeks 1–2)
- [ ] API authorization middleware implemented
  - What: Create src/lib/auth-middleware.ts with `requireAuth(roles?: string[])`
  - Apply to:
    - [ ] POST /api/services
    - [ ] PUT /api/services/[slug]
    - [ ] DELETE /api/services/[slug]
    - [ ] GET /api/newsletter
  - Done when: Endpoints return 401/403 appropriately; tests added in tests/integration/auth
- [ ] Rate limiting added to public endpoints
  - What: Create src/lib/rate-limiting.ts using LRU
  - Enforce on:
    - [ ] Auth routes (login/register)
    - [ ] Uploads (/api/uploads/*)
    - [ ] Newsletter (/api/newsletter)
  - Done when: 429 on exceeded windows; logs/metrics confirm enforcement
- [ ] Basic abuse/DoS headers
  - What: Add security headers in next.config.mjs (X-Content-Type-Options, X-Frame-Options, CSP scaffold)
  - Done when: Headers present on all routes; no regressions
- [ ] Authenticated endpoint test sweep
  - What: Add vitest integration tests to cover 10+ endpoints with/without roles
  - Done when: All tests pass; coverage >80% for route guards

## Phase 2 — Homepage Redesign (Weeks 3–4)
- [ ] Compact hero section
  - What: Implement components/home/compact-hero.tsx and wire in app/page.tsx
  - Done when: New hero renders with existing brand styles and passes a11y checks
- [ ] Core services section
  - What: Implement components/home/core-services.tsx with 4 key offerings
  - Done when: Services are navigable and tracked via analytics
- [ ] Trust testimonials section
  - What: Implement components/home/trust-testimonials.tsx (logos, ratings, proof bar)
  - Done when: Social proof visible; events fire on carousel/scroll into view
- [ ] Quick Wins section
  - What: Implement components/home/quick-wins.tsx per spec
  - Done when: CTA clicks tracked as `calculator_used` / `consultation_requested`
- [ ] Final CTA section
  - What: Implement components/home/final-cta.tsx with risk‑reversal messaging
  - Done when: Primary CTA tracked; a11y and keyboard focus order validated
- [ ] Optimized footer
  - What: Implement components/ui/optimized-footer.tsx and replace in src/app/layout.tsx
  - Done when: DOM weight reduced ~60% vs current; links, mini‑newsletter, and social icons functional

## Phase 3 — Client Portal Foundations (Weeks 5–8)
- [ ] Secure document upload
  - What: Implement components/portal/secure-document-upload.tsx (UI + stub API); enforce AV scan via existing uploads/quarantine flow
  - Done when: PDF/JPG/PNG upload works; files quarantined then released after scan
- [ ] Financial dashboard
  - What: Implement components/portal/financial-dashboard.tsx with KPI cards + chart stub
  - Done when: Data loads from mocked API; charts render; no layout shift
- [ ] Message center
  - What: Implement components/communication/message-center.tsx and list thread items
  - Done when: Messages list renders; new message modal opens; events tracked
- [ ] Tax deadline tracker
  - What: Implement components/tax/deadline-tracker.tsx with reminder CTA
  - Done when: Deadlines list shows color‑coded urgency; reminder action wired

## Phase 4 — Advanced Features (Weeks 9–12)
- [ ] Expense tracking with receipt OCR (stub)
  - What: Implement components/expenses/receipt-scanner.tsx with OCR stub + edit form
  - Done when: Upload → parse → editable fields → save API stub
- [ ] Automated billing
  - What: Implement components/invoicing/automated-billing.tsx and sequences UI
  - Done when: Sequence steps configurable and persisted via API stub
- [ ] Compliance dashboard
  - What: Implement components/compliance/compliance-dashboard.tsx
  - Done when: Categories render; status pills map to backend enums (stubbed)
- [ ] Security Center dashboard
  - What: Implement components/security/security-center.tsx (security health, fraud detection, access log)
  - Done when: All tiles render; fraud alerts list populated from stub API; access log shows last 20 entries
- [ ] Tools: Tax & ROI calculators
  - What: Implement components/tools/tax-calculator.tsx and components/tools/roi-calculator.tsx
  - Done when: Inputs update results; events tracked; a11y labels added

## Conversion Optimization
- [ ] Conversion‑optimized landing variant
  - What: Implement components/landing/conversion-optimized.tsx (social proof bar, value prop hero, risk‑reversal CTA, social proof section)
  - Done when: Page available behind feature flag/experiment route; Lighthouse perf ≥ 90; form CTA tracked as `consultation_requested`
- [ ] A/B wire‑up for homepage CTAs
  - What: Implement hooks/useABTest.ts and toggle hero CTA variants; emit `ab_test_assigned`
  - Done when: Variant stable per user; events visible in analytics endpoint

## Analytics & Experimentation
- [ ] Event tracking utilities
  - What: Expand src/lib/analytics.ts with `trackEvent` and typings
  - Done when: Key events fire (consultation_requested, service_viewed, calculator_used, document_uploaded, login_success, payment_completed)
- [ ] Analytics ingestion API
  - What: Add src/app/api/analytics/track/route.ts to accept events server‑side
  - Done when: 2xx on valid payload; rate‑limited; unauthorized requests rejected

## Wiring & Integration Tasks
- [ ] Route integration
  - What: Import and use new homepage sections in app/page.tsx (CompactHeroSection, CoreServicesSection, TrustTestimonialsSection, QuickWinsSection, FinalCTASection); replace footer in src/app/layout.tsx
  - Done when: No unused exports; no dead code; types pass
- [ ] API stubs
  - What: Create minimal API routes for uploads, messages, calculators, billing sequences, and security center under src/app/api/* with auth + rate limit
  - Done when: Endpoints return 2xx and pass guards/limits tests
- [ ] Accessibility pass
  - What: Add aria labels/roles; ensure color contrast and keyboard navigation
  - Done when: Lighthouse a11y ≥ 95 on key pages

## QA & Performance
- [ ] E2E coverage
  - What: Add Playwright flows for homepage (including variant), upload, calculators, portal dashboard, security center
  - Done when: CI green; flakes <1%
- [ ] Perf budget
  - What: Set Next.js bundle budgets; track LCP/CLS in analytics reporter
  - Done when: LCP < 2.5s, CLS < 0.1 on homepage median

---

## Notes
- Preserve existing styles/variables; introduce new CSS via scoped classes only.
- No placeholders or TODOs in code; stub APIs return explicit sample payloads.
