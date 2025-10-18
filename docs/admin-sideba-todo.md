# Admin Sidebar — Implementation TODO

Derived from: docs/Sidebar Toggle-enhancement.md (v1.0.0)

Last updated: 2025-10-18

Summary
- Implement a responsive, accessible, persistent, resizable admin sidebar with collapse/expand behaviour, mobile overlay drawer, smooth 300ms animations, keyboard shortcuts, and persistence (localStorage + optional DB sync).

Goals
- Expand/collapse states (256px default, 64px collapsed)
- Desktop resizable (160–420px)
- Mobile overlay drawer
- State persistency and SSR-safe hydration
- WCAG 2.1 AA accessibility (keyboard, screen reader announcements)
- Smooth animations and no layout shift

Deliverables
- Zustand store and selectors (src/stores/admin/layout.store.ts + selectors)
- AdminSidebar and subcomponents (Header, Nav, Resizer, NavigationItem, Footer)
- Header mobile toggle and keyboard shortcuts hook
- Unit tests (store + components), basic integration test for mobile overlay
- Documentation and deployment checklist

Phased TODOs

Phase 0 — Preparation (1 day)
- [ ] Review docs/Sidebar Toggle-enhancement.md and this TODO file (owner: dev)
- [ ] Confirm design tokens and existing style variables (owner: dev)
- [ ] Confirm available UI primitives (Tooltip, Badge, focus utilities) and import paths (owner: dev)
- [ ] Verify tailwind/postcss config and classnames strategy (owner: dev)

Phase 1 — Store & Core API (1–2 days)
- [ ] Create directory: src/stores/admin
- [ ] Implement Zustand store: layout.store.ts
  - Persist sidebar.collapsed and sidebar.width using createJSONStorage + SSR guard
  - Actions: toggleSidebar, setCollapsed, setWidth, setMobileOpen, toggleGroup, setExpandedGroups
  - Enforce width constraints (MIN / MAX)
- [ ] Create selector helpers: layout.store.selectors.ts (individual selectors + SSR-safe hook)
- [ ] Unit tests for store (initial state, toggle, setWidth bounds, persistence)
- [ ] Ensure store works in server/client components (hydration guard)

Phase 2 — Constants, Types & Registry (0.5 day)
- [ ] Add constants: SIDEBAR_WIDTHS, ANIMATION, BREAKPOINTS (src/components/admin/layout/Sidebar/constants.ts)
- [ ] Add types: NavigationItem, SidebarContextValue (types.ts)
- [ ] Confirm/extend NAVIGATION_REGISTRY or getNavigationByPermission usages

Phase 3 — Core Components (2–3 days)
- [ ] AdminSidebar (client): skeleton, responsive behaviour, mobile backdrop, width handling
- [ ] SidebarHeader: collapse/expand buttons, logo, mobile close, keyboard title attributes
- [ ] SidebarNav: render navigation sections, permission checks, badges
- [ ] NavigationItem: link vs group handling, collapsed tooltip behavior, active state, keyboard and focus styles
- [ ] SidebarFooter: user summary, help links, tooltip in collapsed mode
- [ ] SidebarResizer: drag/touch/keyboard support, min/max enforcement, prevent selection while dragging
- [ ] Add aria attributes: aria-label, aria-expanded, role="separator" for resizer

Phase 4 — Integrations & UX polish (1–2 days)
- [ ] useResponsive hook integration: auto-collapse on mobile/tablet
- [ ] Keyboard shortcut hook: Ctrl/Cmd+B toggles, Ctrl/Cmd+[ collapses (respect mac vs windows)
- [ ] Focus management: restore focus after expand, trap focus in mobile drawer when open
- [ ] Tooltip timing: collapsed mode tooltip delay and content
- [ ] Transition & performance: ensure width transitions are hardware-accelerated, avoid layout thrash
- [ ] Desktop spacer element to avoid layout shifts when sidebar resizes

Phase 5 — Testing & Accessibility (1–2 days)
- [ ] Unit tests for components (rendering collapsed/expanded; resizer keyboard events)
- [ ] Integration tests: mobile drawer open/close, route change closes mobile drawer
- [ ] Accessibility checks: Axe/pa11y scan, keyboard-only walkthrough, screen reader announcements
- [ ] E2E or Playwright test: collapse/expand, resize, persistence across reloads
- [ ] Validate tooltips appear on hover in collapsed mode and do not appear when expanded

Phase 6 — Persistence to DB (optional / 1 day + backend)
- [ ] Define API route for saving sidebar preferences per user (if required)
- [ ] Save and load preference on mount; fallback to localStorage if API fails
- [ ] Unit/integration tests for API interaction and fallback

Phase 7 — Documentation & Deployment (0.5 day)
- [ ] Add docs entry (this file) and inline code comments (where helpful)
- [ ] Add acceptance criteria checklist to story/PR template
- [ ] Add build/test steps to CI where appropriate

Acceptance Criteria (must pass before merge)
- [ ] Collapsed toggles to 64px and expands to 256px (or user-saved width)
- [ ] Transition duration 300ms with ease-in-out
- [ ] Mobile drawer overlays full screen and closes on backdrop or route change
- [ ] Collapsed icons show tooltips on hover and accessible names for screen readers
- [ ] State persists across reloads (localStorage) and optional DB persistence works
- [ ] Keyboard shortcuts and resizer keyboard controls function correctly
- [ ] No layout shift or flash; spacer properly maintained for content layout
- [ ] Unit + integration tests passing

Testing Checklist
- Unit: store, resizer logic, NavigationItem render variations
- Integration: AdminSidebar mount/hydrate behavior, mobile drawer, persistence
- E2E: Playwright script for user toggling + persisting preference
- Accessibility: Axe results, keyboard testing, screen reader announcements

Estimations & Owners
- Estimated effort: 6–10 dev days (depending on optional DB persistence & CI integration)
- Suggested owners: frontend engineer (implement), QA (tests), designer (edge-case visuals)

Risks & Mitigations
- SSR hydration mismatch: use SSR-safe hooks and render skeleton server-side
- CSS variables or tailwind config conflict: verify and match existing tokens, keep original styles
- Persisting state to DB requires auth and migration: use localStorage as primary and gradual rollout for DB sync

Recommended MCP Integrations (suggested — connect via MCP popover)
- Builder.io — content & CMS integration, manage sidebar docs and assets. [Connect to Builder.io](#open-mcp-popover)
- Supabase — preferred DB/auth for persisting user preferences (primary recommendation). [Connect to Supabase](#open-mcp-popover)
- Neon — alternative for serverless Postgres. [Connect to Neon](#open-mcp-popover)
- Netlify — hosting & deployment (if using Netlify). [Connect to Netlify](#open-mcp-popover)
- Zapier — automation tasks (optional) [Connect to Zapier](#open-mcp-popover)
- Figma — design-to-code (use Builder.io Figma plugin for UI conversion). Get plugin via MCP Servers or Figma community.
- Linear — ticket tracking and linking PRs to tasks. [Connect to Linear](#open-mcp-popover)
- Notion — documentation and knowledge management. [Connect to Notion](#open-mcp-popover)
- Sentry — error monitoring for client-side issues. [Connect to Sentry](#open-mcp-popover)
- Context7 — up-to-date docs for libraries/frameworks. [Connect to Context7](#open-mcp-popover)
- Semgrep — security scanning of new code. [Connect to Semgrep](#open-mcp-popover)
- Prisma Postgres — if using Prisma ORM for DB interactions. [Connect to Prisma](#open-mcp-popover)

Notes
- Prefer Supabase for DB/auth if persistence to server is required. For initial rollout, localStorage + optional DB sync is recommended.
- Keep existing style variables and class names consistent with the codebase; do not modify global tokens.

Appendix — Quick File/Path Checklist
- src/stores/admin/layout.store.ts
- src/stores/admin/layout.store.selectors.ts
- src/components/admin/layout/Sidebar/AdminSidebar.tsx
- src/components/admin/layout/Sidebar/SidebarHeader.tsx
- src/components/admin/layout/Sidebar/SidebarNav.tsx
- src/components/admin/layout/Sidebar/NavigationItem.tsx
- src/components/admin/layout/Sidebar/SidebarResizer.tsx
- src/components/admin/layout/Sidebar/SidebarFooter.tsx
- src/hooks/admin/useSidebarKeyboardShortcuts.ts
- src/components/admin/layout/Header/MobileToggleButton.tsx
- tests/store, tests/components, e2e/playwright

---

Generated from docs/Sidebar Toggle-enhancement.md. Update this TODO with dates, assignees and PR links when work begins.
