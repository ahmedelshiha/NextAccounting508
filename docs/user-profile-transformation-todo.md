# User Profile Transformation – Audit, Decisions, and Actionable TODOs

Status: planned
Owner: Admin Team
Last audit: current repo at commit time

## Codebase Audit – What Exists vs. Guide Assumptions

1) Header/user menu
- Existing: src/components/admin/layout/AdminHeader.tsx has a simple user dropdown (Profile, Settings, Sign Out) using shadcn/Radix DropdownMenu.
- Existing: src/components/ui/navigation.tsx also renders a user menu for the marketing/portal header.
- Gap: No advanced UserProfileDropdown component, no theme submenu, no status selector, no "Manage Profile" panel launcher.

2) Theme handling
- Existing: next-themes is already used (e.g., src/components/ui/sonner.tsx). globals.css defines dark variant styles.
- Gap: Custom useTheme hook and bespoke ThemeProvider from the guide are unnecessary; we should reuse next-themes and avoid duplicating theme state.

3) Security (2FA/MFA)
- Existing: /api/auth/mfa/enroll and /api/auth/mfa/verify with lib/mfa.ts, storing secrets/backup codes in VerificationToken table.
- Gap: Do NOT create /api/user/security/2fa; reuse existing endpoints for enrollment/verification. No per-user 2FA columns needed.

4) User profile API
- Existing: /api/users/me supports GET and PATCH (name/email/password with validation and session invalidation). Tenant-aware via withTenantContext.
- Gap: No /api/user/profile, and Prisma schema has no UserProfile model or profile fields like dateOfBirth/address/phone. Adding a new model would be invasive.

5) Database (Prisma)
- Existing: VerificationToken model present. No UserProfile model. Many tenant-scoped models; strong RLS/tenant concerns across code.
- Decision: Defer schema changes. Start by wiring UI to existing /api/users/me for name/email/password. For email/phone verification UX, reuse VerificationToken and existing MFA endpoints where applicable; phone verification may be backlog.

6) UI primitives
- Existing: shadcn/Radix dropdown-menu, dialog, button, etc. are present and widely used. Accessibility patterns already consistent.
- Gap: New components (ProfileManagementPanel, ProfileTab, SecurityTab, EditableField, VerificationBadge) do not exist yet.

7) RBAC/tenancy
- Existing: Most APIs/components assume tenant context; user flows should use withTenantContext, requireTenantContext, and audit logging where needed.
- Action: Ensure any new API/UI interactions follow the same wrappers and logging.

## Key Decisions (to reduce risk and align with repo)
- Use next-themes (no custom ThemeProvider/useTheme). Add a Theme submenu option that simply calls next-themes setTheme.
- Replace AdminHeader and ui/navigation user menus with a shared UserProfileDropdown that: shows user info, theme submenu, help links, sign out, and opens ProfileManagementPanel.
- Implement ProfileManagementPanel with two tabs (Profile/Security). Initially, editable items:
  - Profile: name (PATCH /api/users/me). Date of birth/occupation/address shown as "Add …" placeholders but disabled until schema story is approved.
  - Security: email (display/verify via future endpoint), password change (PATCH /api/users/me with currentPassword), MFA (use /api/auth/mfa/*), passkeys/device sign-in (defer/backlog with copy-only rows).
- Do not introduce new Prisma models in phase 1. Revisit schema extension in a later phase behind a migration plan and tests.

## Updated Scope and Risks
- Scope v1: UI + wiring to existing endpoints only. No DB migrations.
- Risks: Some security flows (phone verification, passkeys) require new endpoints/DB; keep as backlog to avoid destabilizing RBAC/tenancy.
- Mitigation: Clearly mark disabled/backlog items in UI with descriptions and non-interactive actions.

## Updated TODOs (Phase-driven)

### Phase 1 – Foundation & Shared Component
- [ ] Create shared dropdown: src/components/admin/layout/UserProfileDropdown.tsx (uses shadcn Dropdown, next-themes, opens panel)
- [ ] Subcomponents under src/components/admin/layout/UserProfileDropdown/
  - [ ] Avatar.tsx (image/initials + optional status dot)
  - [ ] UserInfo.tsx (compact/full blocks)
  - [ ] ThemeSubmenu.tsx (calls next-themes setTheme)
  - [ ] constants.ts and types.ts (menu/link metadata)
- [ ] Integrate into AdminHeader (replace current user menu only, preserve existing styles/spacing)
- [ ] Integrate into src/components/ui/navigation.tsx for site/portal header user menu

### Phase 2 – Profile Management Panel (UI-first, minimal wiring)
- [ ] Create panel container: src/components/admin/profile/ProfileManagementPanel.tsx (Dialog)
- [ ] Tabs: src/components/admin/profile/ProfileTab.tsx and SecurityTab.tsx
- [ ] Field rows: src/components/admin/profile/EditableField.tsx and VerificationBadge.tsx
- [ ] Profile tab wiring (name only):
  - [ ] Read: GET /api/users/me
  - [ ] Update: PATCH /api/users/me (name)
  - [ ] Placeholders (disabled) for dateOfBirth/occupation/address with helper copy
- [ ] Security tab wiring:
  - [ ] Display email; future "verify" action backlog
  - [ ] Change password: PATCH /api/users/me with currentPassword validation (invoke modal flow)
  - [ ] MFA: call /api/auth/mfa/enroll and /api/auth/mfa/verify
  - [ ] Passkeys/device sign-in/account activity: display-only placeholders with descriptive text

### Phase 3 – Hooks/State
- [ ] Create useUserStatus (localStorage + idle-away UI state only; no server persistence)
- [ ] Create useUserProfile (reads /api/users/me, wraps update calls, handles loading/error)
- [ ] Use next-themes useTheme directly (no custom hook/provider)

### Phase 4 – Tests
- [ ] Unit: UserProfileDropdown (opens, shows info, theme submenu visible, manage profile opens panel)
- [ ] Unit: ProfileManagementPanel (tab switch, editable rows render, disabled placeholders visible)
- [ ] E2E: user-profile.spec (dropdown open, panel open, switch tabs, change theme, change status dot UI)

### Phase 5 – Accessibility & Performance
- [ ] Ensure ARIA roles/labels, focus traps for dropdown/panel
- [ ] No CLS in dropdown; lazy-load panel; memoize heavy subtrees

### Phase 6 – Backlog (requires product/schema approval)
- [ ] Decide storage for extended profile fields (dateOfBirth/occupation/address/phone)
  - Option A: New UserProfile model (migration + tests)
  - Option B: Extend existing User with JSON column for profile extras
- [ ] Phone verification endpoints
- [ ] Passkeys and device sign-in endpoints
- [ ] Email verification endpoint reusing VerificationToken

## Mapping Guide → Repo (Implementation Notes)
- Theme: useTheme from next-themes; do not implement custom ThemeProvider.
- 2FA: reuse /api/auth/mfa/* and lib/mfa.ts.
- Profile updates: use /api/users/me (tenant-aware). Keep RBAC/tenancy wrappers for any new endpoints.
- Admin headers: modify only the user menu section; keep existing layout/spacing and styles intact.
- Dropdown components: use existing shadcn wrappers from src/components/ui/dropdown-menu.tsx and alert-dialog.tsx.

## Environment & Security Checklist
- [ ] NEXTAUTH_* and DATABASE_URL configured
- [ ] Keep secrets out of logs/commits; no console.log in production paths
- [ ] Rate-limit any future verification endpoints
- [ ] Add audit logs when updating profile/security (follow existing logAudit patterns)

## Open Questions
- Which storage approach for extended profile fields is preferred (A vs. B)?
- Do we require phone verification in v1 or defer?
- Should the navigation header (public/portal) expose the same full menu as admin, or a reduced variant?
