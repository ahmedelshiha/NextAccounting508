# User Profile Transformation – Master TODOs (mirrors docs/user-profile-transformation.md)

Guidelines source: docs/user-profile-transformation.md
Status: planned
Owner: Admin Team

## 0) Overview & Goals → Feature TODOs
- [ ] Replace header text label with full dropdown entry point (avatar + name + chevron)
- [ ] Dropdown features
  - [ ] Circular avatar with fallback initials
  - [ ] Display name, email, role, organization
  - [ ] Theme switcher submenu (light/dark/system)
  - [ ] Status selector (online/away/busy) with indicator dot
  - [ ] Quick links: Settings, Security & MFA, Billing, API Keys
  - [ ] Help: Help & Support, Keyboard Shortcuts, Documentation (external)
  - [ ] Sign out with confirmation dialog
  - [ ] Keyboard navigation (Tab/Enter/Escape/Arrows), focus trap, click-outside close
  - [ ] Mobile responsive layout
- [ ] Profile Management Panel (QuickBooks style)
  - [ ] Two tabs: Profile, Sign in & security
  - [ ] Editable rows with right-arrow affordance
  - [ ] Verification badges (email/phone)
  - [ ] 2FA, Authenticator, Passkeys, Device sign-in, Account activity controls
  - [ ] Loading, error, and save states; auto-save or manual save
- [ ] Integration flow: dropdown “Manage Profile” opens panel (default tab configurable)

## 1) Hybrid Architecture → Component & Structure TODOs
- [ ] Create root UserProfileDropdown with trigger and menu content
- [ ] Create ProfileManagementPanel with modal/drawer container, tabs, headers
- [ ] Implement hierarchy per guide (UserInfo header, Status selector, Quick links, ThemeSubmenu, Help, Sign out)

## 2) Component Specifications → Files & Props TODOs
- [ ] src/components/admin/layout/Header/UserProfileDropdown.tsx (Props: className?, showStatus?, onSignOut?, customLinks?)
- [ ] src/components/admin/profile/ProfileManagementPanel.tsx (Props: isOpen, onClose, defaultTab)
- [ ] Subcomponents
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/Avatar.tsx (Props per guide)
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/UserInfo.tsx (Props per guide)
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/ThemeSubmenu.tsx (Props per guide)
  - [ ] src/components/admin/profile/EditableField.tsx (Props per guide)
  - [ ] src/components/admin/profile/VerificationBadge.tsx
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/{types,constants}.tsx
  - [ ] src/components/admin/profile/{types,constants}.tsx

## 3) Implementation Phases → Project Scaffolding TODOs
- [ ] Create directories listed in the guide
- [ ] Create files listed in the guide for dropdown/panel/hooks/APIs/tests
- [ ] Define types and constants (THEME_OPTIONS, STATUS_OPTIONS, MENU_LINKS, HELP_LINKS, TABS, PROFILE_FIELDS, SECURITY_FIELDS)

## 4) Hooks → Behavior TODOs
- [ ] useTheme (system + localStorage + effective theme event)
- [ ] useUserStatus (persisted status + auto-away timeout)
- [ ] useUserProfile (GET/PUT /api/user/profile; state & refresh)
- [ ] useSecuritySettings (toggle 2FA, verify email/phone, setup/remove authenticator; processing states)

## 5) Core Components → Build TODOs
- [ ] Avatar (sizes sm/md/lg; status dot; image/initials)
- [ ] UserInfo (compact/full; organization block; skeleton loading)
- [ ] ThemeSubmenu (radio behavior; icon map; selected state)
- [ ] EditableField (label/value/placeholder, verified badge, action chips, masked value, chevron)
- [ ] VerificationBadge (sizes; success styling)
- [ ] UserProfileDropdown (Radix menu, labels, separators, submenu, link handling, openPanel action, sign-out confirm)
- [ ] ProfileManagementPanel (Dialog; sticky header tabs; lazy content; loading spinner)
- [ ] ProfileTab (header icon, description; PROFILE_FIELDS mapping)
- [ ] SecurityTab (header icon; rows for userId/email/password/phone/authenticator/2FA/passkeys/deviceSignIn/accountActivity)

## 6) Success Criteria Checklist → Verification TODOs
- [ ] Original features validated: avatar fallback, open/close, user info, theme switcher live, status indicator, links functional, keyboard nav, screen reader announcements, focus trap, click outside, responsive, sign out confirm, help links, CLS < 0.001, render time < 100ms
- [ ] QuickBooks features validated: Manage Profile opens panel, two tabs, editable rows, verification badges, action buttons, descriptions, 2FA/authenticator mgmt, passkeys, device sign-in, account activity, headers with icons, masked password, modal/drawer behavior, auto/manual save

## 7) API Implementation → Backend TODOs
- [ ] src/app/api/user/profile/route.ts (GET session+prisma merge; PUT upsert profile; includes organization)
- [ ] src/app/api/user/security/2fa/route.ts (POST toggle twoFactorEnabled)
- [ ] src/app/api/user/verification/email/route.ts (POST send verification; generate/store token; send email)
- [ ] src/app/api/user/security/authenticator/{setup?,index}.ts (POST setup returns QR/secret; DELETE remove)
- [ ] Apply auth guards (getServerSession(authOptions)); error handling, 401/404/500 paths
- [ ] Add rate limiting on mutation endpoints

## 8) Database Schema (Prisma) → Migration TODOs
- [ ] Extend prisma/schema.prisma with UserProfile, Organization relation includes, VerificationToken if absent
- [ ] Run migration: prisma migrate dev --name add_user_profile_security
- [ ] prisma generate

## 9) Testing Strategy → Tests TODOs
- [ ] Unit tests for UserProfileDropdown (render, initials, opens, Manage Profile, theme, status)
- [ ] Unit tests for ProfileManagementPanel (default tab, switch to security, editable rows, verified badge)
- [ ] E2E tests tests/e2e/user-profile.spec.ts (open dropdown, open panel, switch tabs, verification badges, theme set to dark, status change updates dot)

## 10) Deployment & Integration → Checklists TODOs
- [ ] Pre-deployment: unit/E2E pass, migrations staged, env vars set, routes secured, CORS, rate limiting, error logging, email/SMS configured
- [ ] Code quality: TS strict, ESLint clean, Prettier, no console logs, error boundaries, loading states, Lighthouse a11y ≥ 95
- [ ] Performance: analyze bundle (<50KB gz for dropdown), image optimization, lazy-load panel, avoid re-renders, memoization, FCP < 1.5s, TTI < 3s, CLS < 0.1
- [ ] Security: XSS, CSRF for mutations, input validation, SQLi protection (Prisma), secrets masked, verification endpoints limited, sessions secure, 2FA correct
- [ ] Post-deployment: verify dropdown/panel, security flows, verification, mobile, a11y, monitor logs 24h, DB query performance, API < 300ms, theme and status behavior

## 11) Integration Steps → App Wiring TODOs
- [ ] Update src/components/admin/layout/Header/AdminHeader.tsx to render UserProfileDropdown (replacing existing simple menu)
- [ ] Create src/components/providers/ThemeProvider.tsx per guide (or reuse next-themes if preferred)
- [ ] Wrap app in ThemeProvider in src/app/layout.tsx
- [ ] Add src/styles/dark-mode.css and import; ensure transitions and overrides per guide

## 12) Builder.io Integration → TODOs
- [ ] Create src/components/builder/UserProfileDropdownBuilder.tsx
- [ ] Register with withBuilder; expose showStatus input; add metadata image/description

## 13) Git Workflow → Process TODOs
- [ ] Create branch feature/user-profile-hybrid
- [ ] Stage files per components/profile/hooks/api/prisma
- [ ] Compose detailed commit message describing features, components, hooks, APIs, tests (replace placeholder issue number with real one)
- [ ] Push branch and open PR

## 14) Environment Variables → Config TODOs
- [ ] NEXTAUTH_SECRET, NEXTAUTH_URL
- [ ] DATABASE_URL
- [ ] SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- [ ] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

## 15) Repo Alignment Notes (for our codebase)
- [ ] If reusing next-themes, adapt ThemeSubmenu to use existing theme provider; otherwise add ThemeProvider per guide
- [ ] Consider reusing existing MFA endpoints (/api/auth/mfa/*) instead of adding parallel ones; reconcile API plan during implementation
- [ ] If deferring new UserProfile model, scope UI to data available from /api/users/me and add extended fields later
- [ ] Preserve existing styles and spacing in AdminHeader and ui/navigation; do not alter unrelated styling

## 16) Enhancements & Gaps (added by review)
- Accessibility & UX
  - [ ] Return focus to trigger after dropdown/panel close
  - [ ] Add aria-live status announcements for theme/status/profile save
  - [ ] Ensure role="menuitemradio" and aria-checked on theme/status items
  - [ ] Modal: trap focus, make background inert; test mobile screen readers
- Internationalization
  - [ ] Externalize all strings (menu items, badges, errors) to i18n; add RTL checks
- Status experience
  - [ ] Listen to window online/offline and reflect offline status (read-only)
  - [ ] Document auto-away behavior and provide "busy" override that disables auto-away
- Toasts & errors
  - [ ] Use Toaster to display success/error for profile/security actions; map common server errors
- Hooks tests
  - [ ] Unit tests for useUserStatus (auto-away, persistence), useUserProfile (loading/error/update), useSecuritySettings (processing, API paths)
- Panel polish
  - [ ] Code-split ProfileManagementPanel; prefetch on hover/first open intent
  - [ ] Add skeleton placeholders for panel fields while loading
  - [ ] Support swipe-to-close on mobile and backdrop click to close (with confirm on dirty state)
  - [ ] Persist last-active-tab in localStorage
- Security & auditing
  - [ ] Add audit logs on profile/security updates (action keys consistent: user.profile.update, mfa.enroll, mfa.verify)
  - [ ] Ensure CSRF protection on mutations where applicable
- RBAC/visibility
  - [ ] Conditionally render links (Billing/API Keys) based on user permissions/feature flags
- Account activity
  - [ ] Wire "Account activity" row to a simple viewer of recent audit events (last 10)
- Keyboard Shortcuts
  - [ ] Provide /admin/shortcuts page or modal; update Help link accordingly
- Theme
  - [ ] Emit a custom "themechange" event (or document next-themes behavior) for any consumers
  - [ ] Test system-theme change listener (prefers-color-scheme) and persistence
- Performance
  - [ ] Fix avatar container sizes to prevent CLS; pre-size images
  - [ ] Defer non-critical icons; ensure dropdown bundle stays < 50KB gz
- Analytics (optional)
  - [ ] Track menu open, theme changes, status changes, profile saves for product analytics

## 17) Open Decisions
- [ ] Storage strategy for extended profile fields (new model vs JSON extension)
- [ ] Scope and timeline for phone verification, passkeys, device sign-in UI → API parity
- [ ] Single shared menu across admin/portal vs role-specific variations

---

## Progress Log

- 2025-10-19 00:00 UTC — ✅ Scaffolding created for dropdown and panel.
  - Summary: Added UserProfileDropdown with Avatar, UserInfo, ThemeSubmenu; added ProfileManagementPanel plus EditableField and VerificationBadge; defined basic types/constants.
  - Files:
    - src/components/admin/layout/Header/UserProfileDropdown.tsx
    - src/components/admin/layout/Header/UserProfileDropdown/Avatar.tsx
    - src/components/admin/layout/Header/UserProfileDropdown/UserInfo.tsx
    - src/components/admin/layout/Header/UserProfileDropdown/ThemeSubmenu.tsx
    - src/components/admin/layout/Header/UserProfileDropdown/types.ts
    - src/components/admin/layout/Header/UserProfileDropdown/constants.ts
    - src/components/admin/profile/ProfileManagementPanel.tsx
    - src/components/admin/profile/EditableField.tsx
    - src/components/admin/profile/VerificationBadge.tsx
    - src/components/admin/profile/types.ts
    - src/components/admin/profile/constants.ts
  - Notes: Reusing next-themes; ThemeSubmenu implements role="menuitemradio" with light/dark/system. No wiring into AdminHeader yet.
