# Comprehensive Audit Report — Accounting Firm (NextAccounting)

Date: 2025-10-09
Repository snapshot: app built with Next.js (app router), TypeScript and Prisma. This file summarizes technical findings, component structure, state management, APIs, styling, performance, accessibility, browser compatibility, UX patterns, security considerations and recommendations.

---

## Executive summary

This codebase is a production-grade multi-tenant Next.js application (app router) with an extensive admin dashboard, portal, and public marketing pages. It uses Prisma + PostgreSQL (with optional Netlify/Neon compatibility), NextAuth for auth, Tailwind CSS for styles, Zustand and React Context for state, SWR for client data fetching and Sentry for monitoring. The app demonstrates strong engineering practices (middleware for RBAC & tenant resolution, audit logging, typed API handlers, zod validation, test coverage with Vitest/Playwright). Key opportunities: enforce CSP in production, tighten cookie flags, incrementally optimize admin bundle size and run automated accessibility checks.

---

## 1) Technical Stack Details

- Frameworks and core libs:
  - Next.js 15.5.4 (app router, turbopack)
  - React 19.1.0
  - TypeScript 5.x
  - Prisma 6.15.0 (Postgres datasource)
  - NextAuth 4.24.11 (JWT strategy with Prisma adapter)

- Styling / UI:
  - Tailwind CSS v4 (via @tailwindcss/postcss)
  - class-variance-authority (cva)
  - Radix UI primitives (@radix-ui/react-*)
  - lucide-react icons
  - tw-animate-css
  - sonner (toasts)

- State & data fetching:
  - Zustand (persisted admin layout store)
  - React Context (BookingContext, SettingsProvider, TranslationProvider)
  - SWR (client-side fetching)
  - react-hook-form

- Data & integrations:
  - PostgreSQL (Prisma schema present)
  - ioredis (optional redis integration)
  - Stripe, SendGrid (dependencies present)
  - Sentry (@sentry/nextjs)

- Testing, build & dev tooling:
  - Vitest (unit tests), Playwright (e2e)
  - ESLint + eslint-config-next
  - pnpm package manager
  - PostCSS + autoprefixer
  - Netlify & Vercel config included (netlify.toml, vercel.json)

- package.json highlights (scripts & versions):
  - dev: `pnpm run next-dev` (next dev)
  - build pipeline: prisma generate, lint, typecheck, next build --turbopack
  - test: vitest, playwright present

Files consulted: package.json, next.config.mjs, postcss.config.mjs, netlify.toml, vercel.json

---

## 2) Current Component Structure

High-level tree (key folders and representative files):

- src/app/ — App routes and entry points
  - layout.tsx (global layout, Session/Settings providers, SEO and instrumentation removal to avoid hydration mismatch)
  - page.tsx (marketing/home)
  - admin/, portal/ (nested app routes for both surfaces)
  - api/ (Next.js route handlers; many admin and portal endpoints)

- src/components/
  - ui/ (Button, dialog, dropdown, navigation, card etc.)
  - admin/ (analytics, dashboard widgets, providers, monitoring)
  - dashboard/ (realtime providers, tables)
  - booking/ (wizard steps)
  - providers/ (SettingsProvider, TranslationProvider, AdminProviders client/server variants)

- src/lib/ — utilities and platform glue
  - auth.ts, api.ts, prisma.ts (lazy Prisma client), tenant-context.ts, api-wrapper, org-settings.ts, audit, rate-limit, security utilities

- src/stores/ — Zustand stores
  - adminLayoutStore.ts (persisted)
  - adminLayoutStoreSSRSafe.ts (no persistence for SSR safety)

- src/contexts/
  - BookingContext.tsx (booking flow state machine/steps)

Naming conventions and patterns:
- Components use clear folder segmentation (ui, admin, booking, providers)
- cva used for variant-driven utility classes (Button)
- Server-client split: AdminProvidersServer vs AdminProviders.client / Hydrator for client hydration
- API handlers use zod for validation in many routes and consistent with Next.js route handlers

Code patterns:
- middleware for tenant resolution and RBAC checks
- withTenantContext and requireTenantContext wrappers for API routes
- audit logging sprinkled in auth, admin events
- careful defenses for DB-absent demo-mode (demo users, PRISMA_MOCK)

---

## 3) State Management

- Global app-state:
  - Zustand for admin layout and persisted UI state (use of subscribeWithSelector and persist middleware)
  - SSR-safe alternative provided to avoid hydration issues (no persistence)

- Local/feature state:
  - React Context for booking flow (BookingContext) with reducer-driven step logic
  - TranslationProvider, SettingsProvider using useState/useEffect for client-side hydration

- Session state:
  - next-auth session (JWT strategy) shared via SessionProvider on client
  - Token includes role, tenant metadata, sessionIpHash, sessionVersion. sessionVersion invalidation is used to invalidate tokens on password changes.

- Data flow:
  - Server components fetch server-side via route handlers / Prisma
  - Client components use SWR fetcher or apiFetch wrapper
  - apiFetch includes timeouts, retry logic, tenant injection (non-prod), and origin fallback

---

## 4) API Integration

- API routes: Extensive set under src/app/api including admin/*, portal/*, public/*, tools/* and more. Patterns:
  - GET/PATCH/DELETE handlers with withTenantContext guard
  - zod validations in route handlers (ex: /api/users/me uses zod)
  - middleware enforces tenant resolution, RBAC route checks, and IP allowlists

- Authentication and Authorization:
  - next-auth Credentials provider with Prisma adapter (when DB present)
  - JWT sessions with custom token fields (tenantId, tenantSlug, tenantRole, sessionVersion)
  - MFA/step-up for SUPER_ADMIN and optional ADMIN MFA verification
  - Rate limiting and audit logging for auth flows
  - RBAC: PERMISSIONS enum + ROLE_PERMISSIONS table + middleware route guarding

- Data fetching:
  - Server: Prisma queries (shared prisma client via src/lib/prisma.ts) guarded by tenant-guard
  - Client: SWR for polling and revalidation. apiFetch wrapper provides retries/timeouts and same-origin fallbacks

- Backend structure:
  - Prisma models reflect full product needs (Tenant, User, Service, Booking, ServiceRequest, Settings etc.)
  - Organization and integration settings per-tenant
  - Optional Redis used for rate-limiting & caching

---

## 5) Styling Approach

- Framework: Tailwind CSS (v4) + PostCSS. Global theme tokens are defined in `src/app/globals.css` via CSS variables and a custom dark variant
- Component styling: `cva` for declarative variants (Button uses cva); Radix primitives styled via utility classes
- Design tokens: color tokens and radius tokens declared in :root and .dark in globals.css; RTL helper styles present
- Responsive breakpoints: Tailwind defaults in use; code preserves RTL and specific helper classes. Keep media query breakpoints native to Tailwind configuration (no custom breakpoints file found)
- Inline styles: minimized; components use utility classes and className-based variant systems

---

## 6) Performance Issues & Opportunities

Observed configuration and opportunities:

- Baseline metrics: monitoring/config.json includes example targets (firstLoadTime: 3000ms, navigationTime: 500ms)
- Next.js chunk splitting: `next.config.mjs` includes custom splitChunks cacheGroups for admin-components, admin-utils, ui-components, state-management, icons — strong start for optimizing admin bundle

Opportunities:
- Audit Admin bundles: ensure heavy charts (chart.js), chart wrappers and admin-only utilities are dynamic-imported so public pages don’t load them
- Tree-shake icons: prefer lucide-react with selective imports or an icon loader to reduce repeated icon code
- Images: Audit use of next/image vs <img> and add appropriate sizes and content-encoding
- CSP & 3rd-party scripts: CSP currently report-only; enforcement could block legitimately needed analytics if not staged
- Data fetching: use cache headers for public GETs, SWR refresh strategies tuned to avoid over-fetching
- Edge runtime: evaluate moving lightweight public endpoints to Edge for faster cold starts

Bottlenecks to check:
- Large vendor libraries imported in top-level server/client components
- Unbounded server-side queries in list endpoints (use pagination/limit)
- long-running auth flows waiting on DB (RootLayout uses short timeout for getServerSession to avoid blocking)

---

## 7) Accessibility Gaps

Positives:
- Skip-to-main link in layout
- Focus-visible styles and consistent ring tokens
- Radix primitives used for accessibility-friendly components

Gaps to address:
- Run automated checks (axe, Playwright accessibility plugin) across admin, portal and public pages
- Verify form labels, aria-describedby usage in booking forms and modals
- Contrast: tokens should be reviewed against WCAG for both light and dark themes
- Keyboard navigation around complex widgets (charts, custom dropdowns, modal focus traps) should be validated

Suggested fixes:
- Add a11y tests into Playwright e2e suite (a11y checks per landing/admin page)
- Add ARIA roles/landmarks where missing (main, nav, complementary)

---

## 8) Browser Compatibility

- Primary support: modern evergreen browsers (Chrome, Edge, Firefox, Safari)
- Polyfills & fallbacks: code assumes modern APIs (AbortController, fetch, IndexedDB). Fallbacks exist (e.g., apiFetch handles timeout via DOMException) but legacy browsers (IE11) are not targeted.

Known areas to test:
- iOS Safari behavior around service workers, keepalive and IndexedDB (offline queue)
- Edge runtime compatibility for serverless edge functions (if used)

---

## 9) User Experience Patterns

Navigation & flows:
- Clear separation in routes: /admin for staff, /portal for clients, public marketing pages at root
- Nav items in UI include Home, About, Services, Blog, Contact, Sign In (see src/components/ui/navigation.tsx)
- Multi-step booking flow implemented via BookingContext reducer (step guards and validation)

Pain points & recommendations:
- Hydration sensitivity: mitigated with SSR-safe stores and early attribute cleanup script in layout. Continue to watch for other RSC -> client transitions.
- Admin pages heavy: add skeleton loaders and incremental chunking to improve perceived performance
- Locale & RTL: translation provider sets document.dir and toggles .rtl helper class; ensure localized strings for link labels and aria attributes

---

## 10) Security Considerations

Current posture (strong):
- Tenant resolution via middleware (subdomain or token). Signed tenant cookie issued for authenticated requests
- IP allowlist with CIDR support plus audit logging on admin access decisions
- RBAC via permissions enum, middleware route checks and route-level permission mapping
- MFA enforcement for SUPER_ADMIN and conditional for ADMIN
- Rate limiting (memory or Redis-backed) for auth endpoints and general API protection
- Prisma tenant guard, audit logs for critical operations

Recommendations:
- Enforce Content-Security-Policy in production (not report-only) after validating third-party scripts
- Ensure cookies are set with `secure`, `httpOnly` and `sameSite=strict` in production for session and tenant cookies
- Validate all serialized user input at the server (zod used in places; apply consistently)
- Secrets: avoid leaking DSNs/keys into client; prefer environment vars via provider integrations

---

## What You Can Share (for a deeper audit)

If you provide any of the following, I can produce a more targeted report and code-level fixes:
- Lighthouse/CI audit HTML or Lighthouse results
- Current performance metrics (RUM, synthetic)
- Full project file tree listing (if you want a deeper component mapping)
- package.json (already inspected)
- Design tokens / Figma links (use Builder.io Figma plugin)
- API docs or OpenAPI JSON (openapi/admin-services.json is present)
- Known issue list or user feedback

---

## Actionable next steps (prioritized)

1. Enforce CSP in production: flip Report-Only to enforcement after staging runs. (next.config.mjs headers())
2. Audit admin bundle: dynamic-import charting & analytics, confirm splitChunks output in production build. Measure using bundle analyzer.
3. Add Playwright + axe a11y checks to CI for core flows (login, booking, admin list pages).
4. Verify cookie flags and session cookie security in all production environments.
5. Run automated Lighthouse (CI) for home & admin landing and integrate performance budgets (tests/thresholds.test.ts already enforces some budgets).
6. Consider connecting Supabase (or Neon) via MCP for DB-managed dev workflows, and Sentry via MCP for easier error monitoring.

---

## Suggested MCP Integrations (available in Builder.io MCP list)

All recommended MCP integrations (you can open the MCP popover to connect any of these):

- Supabase — Preferred for DB, auth, and real-time subscriptions. Use cases: dev/test DB, auth alternatives, storage, simple API endpoints. Connect: [Open MCP popover](#open-mcp-popover) and choose Supabase.
- Neon — Serverless Postgres alternative to host your Prisma DB. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Neon.
- Netlify — Deploy and host the app with Netlify-specific plugin (netlify.toml present). Connect: [Open MCP popover](#open-mcp-popover) -> Connect to Netlify.
- Zapier — Automation workflows (integrate events, webhooks). Connect: [Open MCP popover](#open-mcp-popover) -> Connect to Zapier.
- Figma — For design-to-code workflows. Use the Builder.io Figma plugin (Get Plugin) when you have Figma URLs. Do not attempt to fetch Figma URLs directly; instead use the plugin.
- Builder CMS (Builder.io) — Manage marketing/content pages and components. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Builder.io.
- Linear — Project/issue management integration. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Linear.
- Notion — Documentation and knowledge base. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Notion.
- Sentry — Error monitoring and performance traces. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Sentry.
- Context7 — Up-to-date docs for frameworks/libraries. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Context7.
- Semgrep — Security scanning/SAST. Use to scan code for vulnerabilities before deploy. Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Semgrep.
- Prisma Postgres — Prisma/DB management tooling (if listed). Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Prisma.

Note: Prefer Supabase for DB-related tasks; Neon is a viable alternative. To connect any MCP go to the Builder UI and click the MCP popover.

---

## Appendix: Key files & locations referenced during audit

- package.json (root)
- next.config.mjs
- src/app/layout.tsx
- src/app/globals.css
- src/components/ui/button.tsx
- src/components/admin/providers/AdminProviders.tsx (client/server/hydrator)
- src/components/providers/SettingsProvider.tsx, translation-provider.tsx
- src/contexts/BookingContext.tsx
- src/stores/adminLayoutStore.ts, adminLayoutStoreSSRSafe.ts
- src/lib/* (prisma.ts, auth.ts, api.ts, tenant-context.ts, org-settings.ts, security/*)
- prisma/schema.prisma
- netlify.toml and vercel.json
- tests (Vitest) and e2e (Playwright)

---

If you want, I can: run a Lighthouse pass on your dev URL, create a prioritized task list (todo) for remediation, or open a PR that implements a subset of the recommendations (for example: dynamic-importing charts + adding lighthouse CI). Tell me which next step you prefer.
