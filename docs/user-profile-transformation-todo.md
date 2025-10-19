# User Profile Transformation – Actionable TODOs

Status: planned
Owner: Admin Team

## Phase 1 – Foundation Setup
- [ ] Create directories
  - [ ] src/components/admin/layout/Header/UserProfileDropdown
  - [ ] src/components/admin/profile
  - [ ] src/hooks/admin
  - [ ] src/app/api/user/profile
  - [ ] src/app/api/user/security/2fa
  - [ ] src/app/api/user/security/authenticator
  - [ ] src/app/api/user/verification/email
  - [ ] src/app/api/user/verification/phone
- [ ] Create initial files
  - [ ] src/components/admin/layout/Header/UserProfileDropdown.tsx
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/Avatar.tsx
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/UserInfo.tsx
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/ThemeSubmenu.tsx
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/types.ts
  - [ ] src/components/admin/layout/Header/UserProfileDropdown/constants.ts
  - [ ] src/components/admin/profile/ProfileManagementPanel.tsx
  - [ ] src/components/admin/profile/ProfileTab.tsx
  - [ ] src/components/admin/profile/SecurityTab.tsx
  - [ ] src/components/admin/profile/EditableField.tsx
  - [ ] src/components/admin/profile/VerificationBadge.tsx
  - [ ] src/components/admin/profile/constants.ts
  - [ ] src/hooks/admin/useTheme.ts
  - [ ] src/hooks/admin/useUserStatus.ts
  - [ ] src/hooks/admin/useUserProfile.ts
  - [ ] src/hooks/admin/useSecuritySettings.ts

## Phase 2 – Hooks
- [ ] Implement useTheme with localStorage + system preference support
- [ ] Implement useUserStatus with auto-away timer and persistence
- [ ] Implement useUserProfile with GET/PUT to /api/user/profile
- [ ] Implement useSecuritySettings with 2FA, email, phone, authenticator actions

## Phase 3 – Core Components
- [ ] Build Avatar with size and status dot variants
- [ ] Build UserInfo (compact/full) with organization section
- [ ] Build ThemeSubmenu with light/dark/system selection
- [ ] Build UserProfileDropdown integrating:
  - [ ] Radix dropdown menu
  - [ ] Status selector (online/away/busy)
  - [ ] Account links (Settings, Security & MFA, Billing, API Keys)
  - [ ] Theme submenu
  - [ ] Help links (Help & Support, Keyboard Shortcuts, Documentation)
  - [ ] Sign out confirmation
  - [ ] "Manage Profile" opens ProfileManagementPanel

## Phase 4 – Profile Management Panel
- [ ] Build ProfileManagementPanel modal/drawer with tabs
- [ ] Build ProfileTab rendering PROFILE_FIELDS
- [ ] Build SecurityTab rendering security items (email, password, phone, authenticator, 2FA, passkeys, device sign-in, account activity)
- [ ] Wire onFieldClick handlers to edit flows (open edit UI or route)

## API Implementation
- [ ] Create src/app/api/user/profile/route.ts
  - [ ] GET returns merged user + profile + organization
  - [ ] PUT upserts profile and updates name; returns updated shape
- [ ] Create src/app/api/user/security/2fa/route.ts (POST toggles twoFactorEnabled)
- [ ] Create src/app/api/user/security/authenticator/route.ts (DELETE removes, POST /setup issues secret/QR)
- [ ] Create src/app/api/user/verification/email/route.ts (POST sends verification email)
- [ ] Create src/app/api/user/verification/phone/route.ts (POST verifies phone code)
- [ ] Secure routes with getServerSession(authOptions)
- [ ] Add rate limiting and error handling

## Database (Prisma)
- [ ] Update prisma/schema.prisma with UserProfile model and relations
- [ ] Add VerificationToken model if missing
- [ ] Run migrations: prisma migrate dev --name add_user_profile_security
- [ ] prisma generate

## Integration Steps
- [ ] Update src/components/admin/layout/Header/AdminHeader.tsx to render <UserProfileDropdown showStatus={true} />
- [ ] Add ThemeProvider at src/components/providers/ThemeProvider.tsx
- [ ] Wrap app in ThemeProvider in src/app/layout.tsx
- [ ] Add optional dark-mode CSS at src/styles/dark-mode.css and import where appropriate

## Testing
- [ ] Unit tests: src/components/admin/layout/Header/UserProfileDropdown/__tests__/UserProfileDropdown.test.tsx
  - [ ] Avatar fallback to initials
  - [ ] Dropdown opens and shows user info
  - [ ] Manage Profile link exists
  - [ ] Theme options visible
  - [ ] Status selector visible when enabled
- [ ] Unit tests: src/components/admin/profile/__tests__/ProfileManagementPanel.test.tsx
  - [ ] Default tab loads
  - [ ] Tab switch to Security shows fields
  - [ ] Editable rows render with chevrons
  - [ ] Verified badge renders when applicable
- [ ] E2E: tests/e2e/user-profile.spec.ts
  - [ ] Dropdown opens
  - [ ] Panel opens and tabs switch
  - [ ] Theme toggles dark mode (html.dark)
  - [ ] Status changes reflected by status dot

## Accessibility & Performance
- [ ] Keyboard navigation, ARIA roles, focus trap for dropdown and modal
- [ ] Announce state changes for screen readers
- [ ] No CLS in dropdown; render < 100ms
- [ ] Lazy load ProfileManagementPanel
- [ ] Memoize heavy subtrees and avoid unnecessary re-renders

## Security & Compliance
- [ ] Input validation on all mutations (zod or server-side checks)
- [ ] CSRF protection for mutations where required
- [ ] Do not return sensitive secrets; mask password fields
- [ ] Rate limit verification endpoints
- [ ] Ensure session handling is secure; enforce auth on routes

## Environment Variables
- [ ] Configure NextAuth (NEXTAUTH_SECRET, NEXTAUTH_URL)
- [ ] Configure DATABASE_URL
- [ ] Configure SMTP_* for email verification
- [ ] Configure Twilio vars for phone verification as needed

## Deployment Checklist
- [ ] Unit and E2E tests passing in CI
- [ ] Prisma migrations applied to staging/production
- [ ] Environment variables set in deployment platform
- [ ] Error logging (Sentry) enabled and DSN configured
- [ ] Verify API response times (< 300ms) and dropdown bundle size (< 50KB gz)
- [ ] Post-deploy QA: profile editing, security flows, verification, mobile responsiveness, accessibility score ≥ 95
