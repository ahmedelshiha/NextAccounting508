# Accounting Website Redesign — Execution Plan (Aligned with Codebase Audit)

Audited: routes, components, and APIs under src/app, src/components, src/lib. Checked homepage, uploads, portal, admin, payments, newsletter, and security utilities.

## ✅ Completed
- [x] Resolve install failure and generate Prisma client
  - What: Ran `pnpm install --no-frozen-lockfile` and `pnpm db:generate`; dev server on :3000
  - Why: Unblocked development; Prisma client ready
- [x] Homepage assembled with current sections
  - What: app/page.tsx uses Hero, Services, Trust, Testimonials, Blog
  - Files: src/app/page.tsx; src/components/home/{hero-section,services-section,TrustSection,testimonials-section,blog-section}.tsx
  - Next: Add Quick Wins + Final CTA
- [x] Rate limiting foundation present and applied across APIs
  - What: src/lib/rate-limit.ts used in many admin/portal/public routes
  - Next: Extend to newsletter and auth endpoints; add 429 handling tests
- [x] Secure uploads API with AV scanning
  - What: src/app/api/uploads/route.ts enforces type/size + optional ClamAV scan; persists attachments
  - Next: Build client UI component and quarantine review flow in portal
- [x] Payments foundation
  - What: checkout/webhook endpoints exist under src/app/api/payments/*
  - Next: Automated sequences UI and dunning logic

## Phase 1 — Security & Core Protections (Weeks 1–2)
- [ ] Central API authorization helper
  - What: Create src/lib/auth-middleware.ts with `requireAuth(roles?: string[])`
  - Done when: Reused in targeted endpoints; 401/403 consistently enforced
- [ ] Apply auth to uncovered endpoints
  - [ ] GET /api/newsletter (currently public)
  - [ ] Any remaining list/export endpoints missing auth in admin scope
- [ ] Extend rate limiting to uncovered endpoints
  - [ ] /api/newsletter (POST, GET)
  - [ ] /api/auth/register/* and login flows
- [ ] Security headers
  - What: Add X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and CSP scaffold in next.config.mjs
  - Done when: Headers present; no regressions
- [ ] Guard tests for protected routes
  - What: Vitest integration for 10+ endpoints with/without roles
  - Done when: 100% pass; >80% guard coverage

## Phase 2 — Homepage Redesign (Weeks 3–4)
- [ ] Compact hero variant
  - What: components/home/compact-hero.tsx; feature-flag switch in app/page.tsx
- [x] Core services section
  - What: Already implemented (services-section.tsx)
- [x] Trust/testimonials
  - What: TrustSection + testimonials-section.tsx present
- [ ] Quick Wins section
  - What: components/home/quick-wins.tsx; CTA events wired
- [ ] Final CTA section
  - What: components/home/final-cta.tsx with risk-reversal CTA
- [ ] Optimized footer
  - What: components/ui/optimized-footer.tsx; replace Footer usage in layout/client layout

## Phase 3 — Client Portal Foundations (Weeks 5–8)
- [ ] Secure document upload UI
  - What: components/portal/secure-document-upload.tsx; post to /api/uploads; show categories & statuses
  - Backend: Already implemented (uploads API with AV)
- [ ] Financial dashboard
  - What: components/portal/financial-dashboard.tsx; KPI + chart
- [ ] Message center
  - What: components/communication/message-center.tsx; wire to /api/portal/chat
  - Backend: Present (/api/portal/chat); portal widgets exist (LiveChatWidget, RealtimeConnectionPanel)
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
  - Current: src/lib/analytics.ts exposes trackConversion
  - What: Add `trackEvent(event, props)`; unify and type events; no-op SSR
- [ ] Analytics ingestion API
  - What: src/app/api/analytics/track/route.ts; rate-limited; validates payload

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

## Audit Notes
- Homepage sections present; Quick Wins/Final CTA absent.
- Footer exists (components/ui/footer.tsx); optimized variant not present.
- Strong API coverage with getServerSession + permissions; newsletter GET lacks auth.
- Rate limiting is broadly implemented; extend to newsletter/auth routes.
- Uploads API is robust with AV; needs portal-facing UI.
- Payments endpoints exist; automated dunning UI pending.
- No A/B hook or analytics ingestion endpoint yet.
