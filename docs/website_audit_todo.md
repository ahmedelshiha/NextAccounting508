# Website Audit & Implementation Todo

Purpose: Ordered, dependency-aware, actionable tasks to implement the Website Audit (docs/website_audit_guide.md). Each task is specific, measurable, and outcome-oriented. Mark tasks complete with [x].

---

## Legend
- [ ] = pending
- [x] = completed
- Acceptance criteria are shown in parentheses after each task.

---

## 0. Repository & Environment Setup (Prerequisites)

- [ ] Create a feature branch: `ai/website-audit-<date>` (Outcome: branch created and pushed to remote; PR draft ready)  
- [ ] Run full test suite: `pnpm test` (Outcome: all existing tests pass locally; capture failing tests)  
- [ ] Install and verify dependencies: `pnpm install` then `pnpm db:generate` (Outcome: no missing deps, prisma generated)  
- [ ] Verify Dev server runs: `pnpm dev` and open local preview (Outcome: dev server starts without errors)
- [ ] Add CI check step (optional): Ensure `pnpm test` is run on PRs (Outcome: pipeline configured or noted)

---

## A. Design & Tokens (Prerequisite for UI work)

- [ ] Add/confirm typography scale and color tokens in CSS/Tailwind config (file: `src/app/globals.css` or tailwind config) (Acceptance: tokens added and referenced by class names in next tasks)  
- [ ] Create a short design spec doc for spacing/typography (file: `docs/design_tokens.md`) (Acceptance: lists section paddings, card paddings, headline sizes used across pages)

---

## Phase 1 — Critical Fixes (Prerequisite: A)
Order: 1) hero sizing, 2) service cards, 3) mobile touch targets, 4) quick tests

- [ ] Replace oversized hero headline sizes and padding in hero component (files to edit: `src/app/about/page.tsx` or `src/components/home/hero-section.tsx` if present)  
  - Actionable steps: change `text-6xl` → `text-5xl` and mobile to `text-3xl`; change section padding `py-16` → `py-8 lg:py-12`.  
  - Acceptance: hero displays within 2 viewport heights on mobile; visual check on iPhone 12 and desktop 1440px.

- [ ] Compact Services section card dimensions and spacing (files: `src/components/home/services-section.tsx` or `src/components/services/ServicesList.tsx`)  
  - Actionable steps: reduce icon container from `w-16 h-16` → `w-12 h-12`, card padding `p-6` → `p-4` where appropriate, grid gaps `gap-12` → `gap-5`.  
  - Acceptance: four-card grid fits in view and card CTAs visible without overflow; visual regression tests pass.

- [ ] Ensure mobile touch-targets meet 44px minimum (global buttons and CTAs) (files: `src/components/ui/button.tsx`, global styles)  
  - Actionable steps: update button base class to include `min-h-[44px]` and verify on mobile breakpoints.  
  - Acceptance: all primary CTAs measure >=44px on mobile using browser devtools.

- [ ] Run manual smoke tests for Phase 1 changes and fix visual regressions (Acceptance: no layout breakage; record screenshots for iPhone 12, iPad, desktop 1440px)

---

## Phase 2 — Essential Features (Depends on Phase 1)

- [ ] Implement Contact Form component (file: `src/components/contact/contact-form.tsx`)  
  - Actionable steps: add client-side validation, loading state, accessible labels, and submission mock; include acceptance success state panel.  
  - Acceptance: form submits (mock) and shows success UI; accessible labels present; Lighthouse accessibility score for contact region >= 90.

- [ ] Add Trust & Security section (file: `src/components/home/trust-section.tsx`)  
  - Actionable steps: include 4 trust indicators, certification logos, and a security notice block; use existing icons and tokens.  
  - Acceptance: section present on homepage, text and contrast meet WCAG AA.

- [ ] Implement FAQ section with expand/collapse and proper aria attributes (file: `src/components/home/faq-section.tsx`)  
  - Actionable steps: keyboard operable accordion pattern; ensure aria-expanded toggles correctly.  
  - Acceptance: keyboard navigation works; screen reader reads questions/answers appropriately.

- [ ] Add conversion-optimized CTA sections (file: `src/components/home/conversion-ctas.tsx` or inline on pages)  
  - Actionable steps: primary CTA above the fold and secondary CTAs after services; trackable events on click.  
  - Acceptance: CTAs visible on desktop & mobile; clicking triggers `trackConversion` with correct event name.

---

## Phase 3 — Advanced Features & Instrumentation (Depends on Phase 2)

- [ ] Add Schema Markup for business (file: `src/components/seo/schema-markup.tsx`)  
  - Actionable steps: implement JSON-LD with business details from audit guide; include Offers and aggregateRating.  
  - Acceptance: Structured data passes Google Rich Results test for AccountingService.

- [ ] Implement image optimizations for hero and key assets (files where images exist, e.g., `src/app/...`)  
  - Actionable steps: use `next/image` with sizes/priority/quality; replace heavy images with webp.  
  - Acceptance: Largest contentful paint reduced on Lighthouse by measurable amount (>50ms improvement target).

- [ ] Setup conversion tracking hooks (file: `src/lib/analytics.ts`) and wire to primary CTAs (e.g., Book Consultation)  
  - Actionable steps: add GA4 + FB pixel stubs, create `TrackableButton` wrapper.  
  - Acceptance: clicking primary CTA triggers `gtag` and `fbq` events in dev console (when stubs loaded).

- [ ] Add performance monitoring script (file: `src/lib/performance.ts`) and wire to `app/layout.tsx`  
  - Actionable steps: implement `reportWebVitals` and page-load-time event.  
  - Acceptance: Web Vitals events are pushed to analytics stubs in dev.

---

## Phase 4 — Accessibility, QA & Release (Depends on Phases 1–3)

- [ ] Full accessibility audit and fixes (Outcome: WCAG AA across critical pages)  
  - Actionable steps: run axe/lighthouse, fix missing ARIA, focus styles, color contrast, alt text.  
  - Acceptance: Axe reports <= 3 violations, all documented and fixed.

- [ ] Cross-device visual QA & screenshots (Outcome: documented evidence for iPhone, Android, iPad, Desktop)  
  - Actionable steps: capture screenshots for each device on homepage, services, booking and contact pages.  
  - Acceptance: No critical layout regressions; screenshots attached to PR.

- [ ] SEO validation (Outcome: metadata and schema verified)  
  - Actionable steps: verify metadata in `app/layout.tsx`, run Google structured data testing, confirm robots indexing settings.  
  - Acceptance: metadata appears in page source and structured data passes tests.

- [ ] Performance verification (Outcome: Lighthouse mobile score >= 90 or measurable improvement compared to baseline)  
  - Actionable steps: run Lighthouse, fix top 3 opportunities, re-run.  
  - Acceptance: document before/after scores in PR description.

- [ ] Create release PR with checklist, screenshots, and testing notes (Outcome: PR created and ready for review)  
  - Actionable steps: open draft PR to `ai/website-audit-<date>` branch with description and checklist.

---

## Ops & Integrations (When helpful — connect via MCP popover)

- [ ] Connect recommended MCP integrations where required (Steps: open MCP popover and connect):  
  - Neon — for Postgres database and backend storage  
  - Netlify — for deployment & hosting  
  - Zapier — for automations (lead mailing)  
  - Figma — use Builder.io Figma plugin for design imports (open plugin via MCP)  
  - Supabase — alternative DB + auth  
  - Builder CMS — content management & models  
  - Linear — project/issue tracking  
  - Notion — documentation & knowledge base  
  - Sentry — error monitoring  
  - Context7 — up-to-date docs for used libs  
  - Semgrep — security scanning  
  - Prisma Postgres — ORM + Postgres management  

  (Acceptance: relevant MCP(s) are connected and credentials/secrets securely stored in platform settings.)

---

## Test & Rollback Plan (Prerequisite to release)

- [ ] Run integration tests: `pnpm test:integration` (Acceptance: tests pass or failures are documented with fixes planned)  
- [ ] Run e2e tests: `pnpm test:e2e` (Acceptance: critical flows (booking, contact) pass)  
- [ ] Prepare rollback instructions in PR description (Outcome: documented steps to revert changes if required)

---

## Appendix — Quick Wins (30-minute tasks)
- [ ] Update hero H1 classes: change `text-4xl sm:text-5xl lg:text-6xl` → `text-3xl sm:text-4xl lg:text-5xl` (Acceptance: hero headline visually reduced)  
- [ ] Reduce section padding `py-12 sm:py-16` → `py-8 sm:py-12` (Acceptance: sections consume less vertical space)  
- [ ] Reduce service icon container `w-16 h-16` → `w-12 h-12` (Acceptance: services grid becomes more compact)

---

If any task references an asset, design, or credential not available, pause and request that asset/credential before proceeding. To start work, tell me which phase to begin and whether you want me to:  
- create the feature branch and open a draft PR,  
- or only generate PR-ready changes for review locally.
