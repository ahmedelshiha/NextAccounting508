# Website Audit & Implementation Todo

Purpose: Ordered, dependency-aware, actionable tasks to implement the Website Audit (docs/website_audit_guide.md). Each task is specific, measurable, and outcome-oriented. Mark tasks complete with [x].

---

## Quick audit summary (automated code scan)
Findings from scanning repository source files (high-impact items listed first):

- Hero headline sizing: src/components/home/hero-section.tsx uses `text-4xl sm:text-5xl lg:text-6xl` (should be reduced). (File: src/components/home/hero-section.tsx)

- Section padding (excessive vertical spacing): Many top-level pages and components use `py-16` or `py-12 sm:py-16`. Notable files:
  - src/app/about/page.tsx
  - src/app/contact/page.tsx
  - src/app/services/page.tsx
  - src/app/blog/page.tsx
  - src/app/booking/page.tsx
  - src/components/home/blog-section.tsx
  - src/components/home/services-section.tsx
  - src/components/home/hero-section.tsx
  (Task: standardize to `py-8 sm:py-12` or `py-10 sm:py-12` depending on section importance.)

- Service card icon sizes: src/components/home/services-section.tsx (and some template/docs) use `w-16 h-16` for icon containers; recommended `w-12 h-12`. (File: src/components/home/services-section.tsx)

- Contact Form: No production component found under src/components/forms/ContactForm or src/components/contact/contact-form (docs reference a ContactForm but codebase lacks it). (Task: implement contact form component.)

- Trust & FAQ sections: Present in the audit guide (docs/website_audit_guide.md) as recommended components but not implemented in source code. (Task: implement TrustSection and FAQSection components and add to homepage.)

- Accessibility (positive): Root skip link exists in src/app/layout.tsx and tests cover many a11y behaviors (aria-current, aria-live, labelled regions). Many components already use aria attributes and role semantics.

- Loading indicators: Many components use `animate-spin` spinners. Audit should standardize accessible loading patterns (use `role="status" aria-live="polite"` or `aria-busy` where appropriate) and ensure spinners are decorative (aria-hidden) when announcement not required.

- Image optimization: Some pages use large hero-like images (docs mention next/image usage) — search/replace opportunities to convert any heavy images to next/image with sizes and priority.

- Instrumentation: Analytics & schema markup are proposed in docs but not fully wired across site.

---

## Notes / Blockers
- Design assets referenced in docs (certification logos, client logos) may live in `/public/certifications` or be missing. If missing, request assets before final QA.
- Connecting analytics (GA4, FB Pixel) or external MCPs (Neon, Netlify, Sentry) requires credentials — ask user whether to connect or provide keys.

---

## Updated Task List (ordered by dependency, broken into small steps)
Each task is specific, actionable, measurable, and outcome-oriented.

### 0. Repo & environment (Prerequisites)
- [ ] Create feature branch `ai/website-audit-<YYYYMMDD>` (Outcome: branch exists locally and pushed to origin)  
- [ ] Run tests: `pnpm test` (Outcome: baseline test results captured in PR description)  
- [ ] Confirm dev server runs: `pnpm dev` (Outcome: site loads locally without build errors)

---

### 1. Typography & Spacing tokens (Prerequisite for UI edits)
- [ ] Create design tokens file or confirm existing tokens in Tailwind config (file: tailwind.config.mjs or src/app/globals.css). (Acceptance: tokens for hero, headings, body, and spacing exist and are referenced by new classes.)
- [ ] Add a short spec `docs/design_tokens.md` listing: hero sizes, section paddings, card paddings, button min-heights. (Acceptance: spec saved and referenced by PR)

---

### 2. Phase 1 — Visual critical fixes (Prerequisite: 1)
Break each visual change into per-file edits so changes are small, reviewable, and reversible.

- Hero headline reduction (edit file):
  - [ ] Edit `src/components/home/hero-section.tsx` — change H1 class from `text-4xl sm:text-5xl lg:text-6xl` to `text-3xl sm:text-4xl lg:text-5xl`. (Acceptance: hero fits within two mobile viewports and no horizontal overflow; screenshot captured for mobile and desktop.)

- Standardize section padding (multiple files):
  For each file below, change `py-16` / `py-12 sm:py-16` → `py-8 sm:py-12` or `py-10 sm:py-12` as noted:
  - [ ] `src/app/about/page.tsx` → `py-8 sm:py-12` (Acceptance: about page vertical height reduced by ~30%)
  - [ ] `src/app/contact/page.tsx` → `py-8 sm:py-12` (Acceptance: contact top fold visible on mobile)
  - [ ] `src/app/services/page.tsx` → `py-10 sm:py-12` (Acceptance: services header spacing balanced)
  - [ ] `src/app/blog/page.tsx` → `py-8 sm:py-12` (Acceptance: blog index shows posts earlier on page)
  - [ ] `src/app/booking/page.tsx` → `py-8 sm:py-12` (Acceptance: booking hero plus form visible above fold on 375px mobile if possible)
  - [ ] `src/components/home/blog-section.tsx` → `py-8 sm:py-12` (Acceptance: blog section vertically tighter)
  - [ ] `src/components/home/services-section.tsx` → `py-10 sm:py-12` (Acceptance: services grid looks compact)
  - [ ] `src/components/home/hero-section.tsx` → `py-8 lg:py-12` (Acceptance: hero used scaled padding per design tokens)

  (For each file, include a short screenshot in PR showing top-of-page before/after.)

- Service card icon & padding edits:
  - [ ] Edit `src/components/home/services-section.tsx` (and `src/components/home/services-card` if exists) — change `w-16 h-16` → `w-12 h-12`, `p-6` → `p-4` for compact cards, and reduce grid gap from `gap-12` → `gap-5`. (Acceptance: 4-card grid fits without excessive vertical whitespace; CTAs visible without scrolling on typical viewports.)

- Button touch-targets global fix:
  - [ ] Edit `src/components/ui/button.tsx` (and any button base classes) — ensure primary button has `min-h-[44px]` and adequate vertical padding on mobile (Acceptance: measured >=44px on iPhone 12 emulation).

- Smoke tests after Phase 1 edits:
  - [ ] Run visual/manual smoke tests (desktop 1440px, mobile 375px): capture screenshots and verify no layout break. (Acceptance: screenshots attached to PR and no regressions found.)

---

### 3. Phase 2 — Essential features (Depends on Phase 1)
Split work into small components and unit-testable units.

- Contact form (implement):
  - [ ] Create `src/components/forms/ContactForm.tsx` with client-side validation, accessible labels, focus management, loading state, and success state. (Acceptance: form returns a mocked success response and shows success UI.)
  - [ ] Add unit tests for validation behavior (tests/forms/contact-form.test.tsx). (Acceptance: tests pass locally.)
  - [ ] Add a CMS/snippet hook (Builder.io registration) if required by content team. (Acceptance: component registered per docs/next integration guide.)

- Trust & Security section (implement):
  - [ ] Create `src/components/home/TrustSection.tsx` with four trust indicators, certification placeholders, and a security notice. (Acceptance: added to homepage; contrast meets WCAG AA.)

- FAQ accordion (implement):
  - [ ] Create `src/components/home/FAQSection.tsx` with keyboard operable accordion, `aria-expanded`, and `aria-controls`. (Acceptance: keyboard operable and screen reader friendly; unit tests validate state toggling.)

- Conversion CTAs (implement and instrument):
  - [ ] Add `src/components/home/ConversionCTAs.tsx` and wire primary CTA to `trackConversion('book_consultation')`. (Acceptance: clicking CTA calls `trackConversion` stub in dev).

---

### 4. Phase 3 — Performance, SEO & Instrumentation (Depends on Phase 2)
Small measurable improvements and verification steps.

- Image optimization:
  - [ ] Convert key hero and above-the-fold images to `next/image` with sizes, quality, and priority settings (files: any page with hero images; start with `src/components/home/hero-section.tsx`). (Acceptance: Lighthouse LCP improves or remains stable; images served as webp where possible.)

- Schema & metadata:
  - [ ] Add `src/components/seo/SchemaMarkup.tsx` and wire structured data on layout or homepage. (Acceptance: passes Google structured data testing.)
  - [ ] Verify `app/layout.tsx` metadata matches docs/website_audit_guide.md and update if needed. (Acceptance: metadata present in page source.)

- Analytics & web vitals:
  - [ ] Implement `src/lib/analytics.ts` (GA4/FB pixel stubs) and `src/lib/performance.ts` reportWebVitals hook. (Acceptance: stubbed events appear in dev console when triggered.)

---

### 5. Phase 4 — Accessibility QA, testing, and release (Depends on Phases 1–3)
- [ ] Run automated a11y scan (axe/lighthouse) on critical pages (Home, About, Services, Booking, Contact). Record results. (Acceptance: <= 3 non-critical violations or documented fixes.)
- [ ] Standardize loading indicators: ensure meaningful ones have `role="status" aria-live="polite"`, and decorative spinners are `aria-hidden="true"`. (Files: src/components/ui/loading.tsx and pages that show full-page loaders.) (Acceptance: axe/lighthouse shows correct patterns.)
- [ ] Cross-device screenshot QA and performance baseline: capture before/after metrics and attach to PR. (Acceptance: PR includes screenshots and Lighthouse reports.)
- [ ] Create release PR with checklist, screenshots, tests, and rollback instructions. (Acceptance: draft PR created for review.)

---

## Tasks for maintainers / questions for you
- Provide certification and client logos to add to TrustSection (if unavailable, we will add placeholders in `/public/certifications`).
- Do you want analytics keys (GA4/FB Pixel) connected now? If yes, provide access or request that I add stubs and instructions. Connecting MCPs requires manual action: [Open MCP popover](#open-mcp-popover).
- Do you prefer `py-8 sm:py-12` globally for all sections, or to keep `py-10` for medium importance sections (services/cards)? Please confirm.

---

If you want, I can now:  
- Create the feature branch and implement Phase 1 (visual fixes) with small commits per file, or  
- Generate PR-ready edits for review only.  

Which do you want me to start with? (I recommend: create the branch + implement Phase 1.)
