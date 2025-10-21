# Manage Profile Integration Plan
## Audit & Design Document

**Date Created:** 2025-01-XX  
**Status:** In Progress  
**Priority:** High

---

## Executive Summary

This document outlines the plan to consolidate user account settings from `/portal/settings` and relevant `/admin/settings` pages into a unified "Manage Profile" interface at `/admin/profile`.

**Current State:**
- User settings scattered across multiple locations
- `/portal/settings` contains personal & notification preferences
- `/admin/settings/*` contains system-wide configurations
- Profile management limited to basic info + security

**Desired State:**
- Single, unified profile management interface
- Comprehensive user account & preference settings
- Organized by logical tabs/categories
- Deduplication of overlapping settings

---

## Settings Audit Findings

### Current Location Mapping

#### `/portal/settings` (Client Portal)
**Account Settings:**
1. Full Name
2. Email
3. Password (change with current password confirmation)
4. Account Deletion (with password confirmation)

**Booking Preferences:**
5. Email Confirmation (checkbox)
6. Email Reminder (checkbox)
7. Email Reschedule (checkbox)
8. Email Cancellation (checkbox)
9. SMS Reminder (checkbox)
10. SMS Confirmation (checkbox)
11. Reminder Timing (24h, 12h, 6h, 2h hours before)
12. Timezone (text input)
13. Preferred Language (text input)

**System Status:**
14. Offline Queue Inspector (debug/monitoring)
15. Realtime Connection Panel (debug/monitoring)

---

#### `/admin/settings/security` (Admin)
**Profile Fields:**
1. User ID
2. Password
3. Two-factor Authentication
4. Email Verification
5. Active Sessions

---

#### `/admin/settings/communication` (Admin - Multi-tab)
**Email Settings:**
- Sender Name
- Sender Email
- Reply-To
- Signature HTML
- Transactional Enabled
- Marketing Enabled
- Compliance BCC

**SMS Settings:**
- Provider (Twilio, Plivo, Nexmo, MessageBird)
- Sender ID
- Transactional Enabled
- Marketing Enabled
- Fallback to Email

**Live Chat Settings:**
- Enabled
- Provider (Intercom, Drift, Zendesk, LiveChat)
- Routing (Round Robin, Least Busy, First Available, Manual)
- Offline Message
- Working Hours (timezone, start, end)
- Escalation Emails

**Notifications Settings:**
- Digest Time
- Timezone

**Newsletters Settings:**
- Enabled
- Double Opt-In
- Default Sender Name/Email
- Archive URL
- Topics

**Reminders Settings:**
- Reminders for Bookings, Invoices, Tasks
- Each with: Enabled, Offset Hours, Template ID, Channels (Email/SMS/Push)

---

### Duplicate Settings Identified

| Setting | Location 1 | Location 2 | Merge Strategy |
|---------|-----------|-----------|-----------------|
| **Timezone** | Portal Settings | Admin Communication | **Consolidate into single "Preferences" tab** |
| **Email Settings** | Portal (sender) | Admin Communication (detailed) | **Split: User Email → Account tab, Organization Email → Communication tab** |
| **Notifications** | Portal Booking Prefs | Admin Communication | **Split: Personal Notifications → Preferences tab, Organization Notifications → Communication tab** |
| **Password** | Portal Settings | Admin Security | **Keep in Security tab only** |
| **Email/SMS Preferences** | Portal Booking Prefs | Admin Communication | **Split by scope: Personal prefs → Preferences, System config → Communication** |

---

## Proposed Tab Structure for Manage Profile

### Tab 1: **Profile** (Existing)
**Purpose:** User identity and basic information
- Full Name
- Email
- Organization
- Avatar/Photo (future enhancement)
- Display Name (future enhancement)

**API:** `/api/user/profile` (GET, PUT)

---

### Tab 2: **Sign in & Security** (Existing)
**Purpose:** Authentication and security settings
- User ID (read-only)
- Password (change with current password)
- Email Verification Status
- Two-Factor Authentication (enable/disable)
- Authenticator Setup
- Passkeys Management
- Active Sessions
- Account Activity Log

**API:** `/api/user/security/*` (existing)

---

### Tab 3: **Preferences** (NEW)
**Purpose:** Personal notification and communication preferences
**Target Users:** All users (portal clients & admins)

**Sections:**
1. **Booking Notifications**
   - Email Confirmation
   - Email Reminder
   - Email Reschedule
   - Email Cancellation
   - SMS Reminder
   - SMS Confirmation
   - Reminder Timing (checkboxes: 24h, 12h, 6h, 2h)

2. **Localization**
   - Timezone (dropdown with common timezones)
   - Preferred Language (dropdown: en, ar, hi)

3. **Notification Delivery**
   - Digest Time (optional - future)
   - Notification Frequency (optional - future)

**Data Source:** Portal Settings `/api/portal/settings/booking-preferences`

**API:** Create/Update → `/api/user/preferences` (new endpoint)

---

### Tab 4: **Communication** (NEW - Admin Only)
**Purpose:** System-wide communication channel configuration
**Target Users:** Admin/Team Lead only (with permission gates)
**Visibility:** Hidden for regular users

**Sections (as collapsible cards or subtabs):**

1. **Email Settings**
   - Sender Name
   - Sender Email
   - Reply-To Address
   - Signature HTML
   - Transactional Enabled (toggle)
   - Marketing Enabled (toggle)
   - Compliance BCC (toggle)

2. **SMS Configuration**
   - Provider (select: None, Twilio, Plivo, Nexmo, MessageBird)
   - Sender ID
   - Transactional Enabled (toggle)
   - Marketing Enabled (toggle)
   - Fallback to Email (toggle)

3. **Live Chat**
   - Enabled (toggle)
   - Provider (select: None, Intercom, Drift, Zendesk, LiveChat)
   - Routing Strategy (select: Round Robin, Least Busy, First Available, Manual)
   - Offline Message (textarea)
   - Working Hours Timezone
   - Working Hours Start/End (time inputs)
   - Escalation Emails (multi-input)

4. **Notification Digest**
   - Digest Time
   - Timezone

5. **Newsletters**
   - Enabled (toggle)
   - Double Opt-In (toggle)
   - Default Sender Name
   - Default Sender Email
   - Archive URL
   - Topics (comma-separated or array)

6. **Reminders Configuration**
   - Bookings Reminders (enabled, offset hours, template ID, channels)
   - Invoices Reminders (enabled, offset hours, template ID, channels)
   - Tasks Reminders (enabled, offset hours, template ID, channels)

**Data Source:** Admin Settings `/api/admin/communication-settings`

**API:** Reuse existing `/api/admin/communication-settings`

---

### Tab 5: **Notifications** (NEW - Debug/System)
**Purpose:** System health and connection status monitoring
**Target Users:** All users (development/debugging)
**Visibility:** Optional, could be moved to admin only

**Sections:**
- Offline Queue Inspector (existing component)
- Realtime Connection Panel (existing component)

**Note:** Consider making this debug-only (hide in production or behind feature flag)

---

## Implementation Roadmap

### Phase 1: Foundation (MVP) ⭐ PRIORITY
**Priority:** HIGH
**Timeline:** 1-2 weeks
**Scope:** Preferences tab with user preferences

**Tasks:**
1. Create new API endpoints:
   - `GET/PUT /api/user/preferences` (personal user preferences)
   - Reuse `/api/portal/settings/booking-preferences`

2. Update ProfileManagementPanel:
   - Add "Preferences" tab
   - Create PreferencesTab component
   - Integrate booking preferences form

3. Update types & constants:
   - Add new tab types: `"preferences" | "communication" | "notifications"`
   - Create preference field definitions

4. Test:
   - Unit tests for PreferencesTab
   - E2E tests for save/load preferences

**Deliverable:** Functional "Preferences" tab with timezone and booking notification settings

---

### Phase 2: Communication Settings (Optional but Recommended)
**Priority:** MEDIUM
**Status:** Completed
**Timeline:** 2-3 weeks
**Scope:** Admin-only communication channel configuration
**Permission Gate:** Admin/Team Lead only

**Tasks:**
1. Create new "Communication" tab in ProfileManagementPanel
2. Create CommunicationTab component
3. Implement permission-based tab visibility
4. Add export/import functionality (from admin/settings/communication)
5. Create accordion sections for each communication channel
6. Implement form validation & error handling

**Deliverable:** Admin-only "Communication" tab for system-wide settings

---

### Phase 3: Notifications System Tab (Optional)
**Priority:** LOW
**Timeline:** 1 week
**Scope:** Debug/system monitoring
**Permission Gate:** Optional (feature flag)

**Tasks:**
1. Move OfflineQueueInspector & RealtimeConnectionPanel to Notifications tab
2. Add debug info toggle
3. Feature flag for production visibility

**Deliverable:** Optional "Notifications" system tab

---

### Phase 4: Migration & Retirement ⭐ MANDATORY
**Priority:** HIGH (after Phase 1 validated)
**Timeline:** 1 week
**Scope:** Retire old `/portal/settings` page
**Dependencies:** Phase 1 must be complete & tested first

**Tasks:**
1. Data migration:
   - Migrate existing portal settings to UserProfile schema
   - Verify no data loss
   - Create rollback script

2. Redirect implementation:
   - Replace `/portal/settings/page.tsx` with redirect to `/admin/profile?tab=preferences`
   - Implement 301 permanent redirect for SEO

3. Update navigation:
   - Remove "Settings" link from portal navigation
   - Search & replace all `/portal/settings` references
   - Update help documentation

4. User communication:
   - Draft email notification (7 days before)
   - Create in-app banner
   - Update FAQ/help docs

5. Testing:
   - Verify all data migrated correctly
   - Test redirect behavior
   - E2E tests for redirect
   - Permission testing with portal users

6. Monitoring (7-day post-deployment):
   - Track redirect traffic
   - Monitor error rates
   - Check for user confusion

7. Cleanup (after 30-day grace period):
   - Remove old page file
   - Archive old documentation
   - Database cleanup (if separate table)

**Deliverable:** Successful migration, old page removed, zero broken links

---

### Phase Timeline Summary

```
Week 1-2:  Phase 1 - Preferences Tab [DO THIS FIRST]
           ↓
Week 3-4:  Phase 2 - Communication Tab (optional)
           ↓
Week 5:    Phase 4 - Migration & Retirement [MANDATORY after Phase 1]
           ↓
Week 6-8:  Phase 3 - Notifications Tab (optional)

Total: 5-8 weeks for all phases
MVP: 1-2 weeks (Phase 1 only) → then migrate & retire
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Manage Profile Page                         │
│                      /admin/profile                             │
└────��─────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────���──────┐ ┌──▼──────┐ ┌──▼──────────┐
    │  Profile   │ │Security │ │Preferences │
    │   Tab      │ │  Tab    │ │   Tab      │
    └─────┬──────┘ └──┬──────┘ └──┬─────────┘
          │           │            │
    ┌─────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
    │ /api/user/ │ │/api/user│ │ /api/user/  │
    │  profile   │ │/security│ │preferences  │
    └────────────┘ └─────────┘ └─────────────┘
          │           │            │
    ┌─────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
    │  User DB   │ �� User DB  │ │UserProfile  │
    │ (name,     │ │(password,│ │  DB         │
    │  email)    │ │  2fa)    │ │(timezone,   │
    │            │ │          │ │ prefs)      │
    └────────────┘ └──────────┘ └─────────────┘

    [COMMUNICATION TAB - ADMIN ONLY]
    ┌──────────────────────┐
    │ Communication Tab    │
    │  (Permission Gate)   │
    └──────────┬───────────┘
               │
    ┌──────────▼──────────────────┐
    │ /api/admin/communication-   │
    │        settings             │
    └──────────┬──────────────────┘
               │
    ┌─��────────▼──────────────────┐
    │ Admin Communication DB      │
    │ (email, sms, chat, etc.)    │
    └─────────────────────────────┘
```

---

## API Endpoints Required

### Existing Endpoints (Reuse)
- `GET/PUT /api/user/profile` ✅
- `POST /api/user/security/2fa` ✅
- `GET/PUT /api/admin/communication-settings` ✅
- `GET /api/portal/settings/booking-preferences` ✅
- `PUT /api/portal/settings/booking-preferences` ✅

### New Endpoints to Create
- `GET /api/user/preferences` - Get user preferences (timezone, language, booking prefs)
- `PUT /api/user/preferences` - Update user preferences
- OR reuse portal endpoint and adapt it for admin profile

---

## Database Schema Updates Required

### Extend UserProfile Model
```prisma
model UserProfile {
  // ... existing fields ...
  
  // Preferences (NEW)
  timezone           String?          @default("UTC")
  preferredLanguage  String?          @default("en")
  
  // Notification Preferences (NEW)
  bookingEmailConfirm     Boolean?     @default(true)
  bookingEmailReminder    Boolean?     @default(true)
  bookingEmailReschedule  Boolean?     @default(true)
  bookingEmailCancellation Boolean?    @default(true)
  bookingSmsReminder      Boolean?     @default(false)
  bookingSmsConfirmation  Boolean?     @default(false)
  reminderHours          Int[]         @default([24, 2])
}
```

---

## Component Architecture

```
ProfileManagementPanel
├── ProfileTab (existing)
├── SecurityTab (existing)
├── PreferencesTab (NEW)
│   ├── BookingNotificationsSection
���   └── LocalizationSection
├── CommunicationTab (NEW - admin only)
│   ├── EmailSettingsSection
│   ├── SmsSettingsSection
│   ├── LiveChatSection
│   ├── NotificationDigestSection
│   ├── NewslettersSection
│   └── RemindersSection
└── NotificationsTab (NEW - optional)
    ├── OfflineQueueInspector
    └── RealtimeConnectionPanel
```

---

## Deduplication Strategy

### Conflict Resolution Rules

| Scenario | Decision | Rationale |
|----------|----------|-----------|
| **Timezone setting** | Keep single instance in Preferences tab; sync across sections | One source of truth for user timezone |
| **Email settings** | Split: User email (Account) vs Organization email (Communication) | Different scopes: personal vs organizational |
| **Notification preferences** | User prefs in Preferences tab; System templates in Communication | Personal prefs vs system configuration |
| **Password** | Security tab only | Standard practice |
| **Verification status** | Security tab only | Authentication concern |

---

## Permission & Access Control

### Tab Visibility Rules

```typescript
const tabVisibility = {
  profile: true,        // Always visible
  security: true,       // Always visible
  preferences: true,    // Always visible
  communication: hasPermission('COMMUNICATION_SETTINGS_EDIT'), // Admin only
  notifications: isDebugMode || hasPermission('ADMIN'),        // Optional
}
```

---

## Testing Strategy

### Unit Tests
- PreferencesTab component rendering
- Form validation
- Timezone selection
- Language preference persistence

### Integration Tests
- API call sequences (GET then PUT)
- Data persistence across page refresh
- Permission-based tab visibility
- Tab switching without data loss

### E2E Tests
- Complete user flow: navigate to profile → change preferences → verify persistence
- Admin flow: access communication settings → modify settings → export
- Error handling scenarios

---

## Migration & Retirement Strategy: `/portal/settings` → `/admin/profile`

### Decision: Migrate & Retire (Phase 3 - Mandatory)
The old `/portal/settings` page will be **deprecated and removed** after successful migration to `/admin/profile`.

### Timeline
- **Week 1-2:** Phase 1 implementation (Preferences tab)
- **Week 3-4:** Phase 2 implementation (Communication tab) - Optional
- **Week 5:** Phase 3 - Migration & Retirement
  - Deploy redirect
  - Monitor usage
  - Remove old page

---

### Phase 3: Migration & Retirement Plan

#### Step 1: Data Migration (Pre-Deployment)

**Migrate existing portal settings data:**

```sql
-- Migrate booking preferences from UserProfile to new structure
UPDATE user_profiles
SET
  timezone = COALESCE(timezone, 'UTC'),
  preferred_language = COALESCE(preferred_language, 'en'),
  booking_email_confirm = true,  -- Default from portal settings
  booking_email_reminder = true,
  booking_email_reschedule = true,
  booking_email_cancellation = true,
  booking_sms_reminder = false,
  booking_sms_confirmation = false,
  reminder_hours = ARRAY[24, 2]
WHERE timezone IS NULL;
```

**Verification script:**
- Count migrated records
- Validate no data loss
- Check for any failed migrations

---

#### Step 2: Redirect Implementation

**Old URL → New URL:**

```typescript
// src/app/portal/settings/page.tsx (REPLACE ENTIRE FILE)

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

export const metadata = {
  title: 'Redirecting to Profile Settings',
}

export default async function PortalSettingsPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Redirect all portal/settings traffic to admin/profile
  redirect('/admin/profile?tab=preferences')
}
```

**Why this approach:**
- SEO friendly (server-side redirect)
- Users with bookmarks auto-redirected
- Explicit tab hint (preferences)
- No broken links

---

#### Step 3: Update Navigation & Links

**Remove from Portal Navigation:**
- Remove "Settings" link from portal sidebar/header
- Remove any internal links to `/portal/settings`

**Files to update:**
```
src/components/portal/navigation.tsx (if exists)
src/app/portal/layout.tsx (remove settings nav item)
src/components/ui/navigation.tsx (remove settings link)
```

**Search & Replace:**
```bash
# Find all references to /portal/settings
grep -r "portal/settings" src/

# Replace with /admin/profile
sed -i 's|/portal/settings|/admin/profile|g' src/**/*.tsx
```

---

#### Step 4: User Communication Plan

**Pre-Migration (1 week before):**
- In-app notification banner on `/portal/settings`:
  > "Your account settings have moved! [Learn more](#) | [Go to new settings](#/admin/profile)"
- Email notification to all portal users
- Update help/FAQ documentation

**During Migration (deployment day):**
- Display info toast on redirect:
  > "Your settings have moved to a new, improved interface!"
- Keep redirect active for 30 days with analytics

**Post-Migration (30 days after):**
- Remove old `/portal/settings` route entirely
- Update any remaining links
- Archive old documentation

---

#### Step 5: Database Cleanup

**After 30-day grace period:**

```sql
-- Remove deprecated columns from portal_settings table (if exists)
-- Only after confirming all data migrated to user_profiles

ALTER TABLE user_profiles
DROP COLUMN IF EXISTS booking_preferences_json;  -- If separate column exists

-- Archive old portal_settings table (if exists)
-- RENAME TABLE portal_settings TO portal_settings_archived;
```

---

#### Step 6: Testing Strategy

**Pre-deployment Testing:**

1. **Migration verification:**
   - [ ] All portal user preferences migrated
   - [ ] No null values in required fields
   - [ ] Timezone data preserved
   - [ ] Language preferences intact

2. **Redirect testing:**
   - [ ] `/portal/settings` → `/admin/profile?tab=preferences` works
   - [ ] HTTP 301 status (permanent redirect)
   - [ ] Bookmarks still work
   - [ ] Deep links work

3. **Permission testing:**
   - [ ] Portal clients can access redirected page
   - [ ] All tabs visible (no permission issues)
   - [ ] Settings load correctly
   - [ ] Can save preferences

4. **E2E tests:**
   ```typescript
   test('portal settings redirect', async ({ page }) => {
     await page.goto('/portal/settings')
     await expect(page).toHaveURL(/\/admin\/profile/)
   })

   test('migrated preferences load', async ({ page }) => {
     await page.goto('/admin/profile?tab=preferences')
     // Verify timezone loaded correctly
     // Verify booking preferences visible
   })
   ```

---

#### Step 7: Monitoring & Rollback Plan

**Post-Deployment Monitoring (7 days):**
- Track `/portal/settings` redirect traffic
- Monitor error rates on `/admin/profile`
- Check analytics for user confusion
- Monitor session/auth issues

**Rollback Scenario:**
If critical issues found:
1. Revert redirect (bring back old page)
2. Keep both URLs active for 30 days
3. Fix issues on admin profile
4. Re-attempt migration

**Rollback command:**
```bash
git revert <commit-hash>  # Revert redirect changes
```

---

### Phase 3 Implementation Tasks

**Task List:**
- [ ] Database migration script created & tested
- [ ] Redirect page created
- [ ] Navigation links updated
- [ ] User communication drafted
- [ ] E2E tests written
- [ ] Staging deployment & testing
- [ ] Pre-deployment checklist complete
- [ ] Production deployment
- [ ] Analytics monitoring setup
- [ ] 30-day grace period management
- [ ] Old page removal
- [ ] Documentation updated
- [ ] Post-mortem & lessons learned

---

### Files to be Retired/Removed

**Delete these after 30-day period:**
```
src/app/portal/settings/page.tsx (becomes redirect only for 30 days)
src/components/portal/SettingsForm.tsx (if exists)
src/components/portal/settings/ (entire directory if exists)
tests/e2e/portal-settings.spec.ts (test for old page)
```

**Archive these:**
- Documentation about old portal settings
- Old API endpoints (if unique to portal)

---

### Dependency Check

**Portal Settings Dependencies:**
```
/portal/settings depends on:
├── /api/portal/settings/booking-preferences
├── /api/users/me
├── useTranslations hook
├── OfflineQueueInspector component
├── RealtimeConnectionPanel component
└── Portal layout wrapper

After migration, these become:
├── /api/user/preferences (NEW)
├── /api/user/profile (EXISTING)
├── useTranslations hook (KEEP)
├── Admin profile components (REUSE)
└── Admin layout wrapper (REUSE)
```

**Action Items:**
- [x] Verify `/api/user/preferences` endpoint created
- [x] Verify `/api/user/profile` exists & works
- [ ] OfflineQueueInspector → move to admin (Notifications tab)
- [ ] RealtimeConnectionPanel → move to admin (Notifications tab)

---

### Success Criteria for Phase 3

- ✅ All portal users redirected to admin profile
- ✅ No data loss during migration
- ✅ User preferences accessible and editable
- ✅ Old page removed (after grace period)
- ✅ Zero broken links
- ✅ Analytics show successful redirect
- ✅ No user support tickets related to migration
- ✅ Documentation updated

---

### Communication Timeline

**T-7 days:** Email notification to users
> "Your account settings are moving to our new admin interface for a better experience. On [DATE], /portal/settings will redirect to the new location."

**T-1 day:** In-app banner warning
> "Settings moving tomorrow! Your preferences will be automatically migrated."

**T+0 (Deployment):** Toast notification
> "Your settings have moved! Check out the new interface at /admin/profile"

**T+7 days:** Follow-up email
> "New settings page live! Here's how to use it. Questions? Contact support."

**T+30 days:** Removal notice
> "Old /portal/settings page removed. All settings now at /admin/profile"

---

## Future Enhancements

### Post-MVP Features
1. Avatar/Photo upload
2. Display name customization
3. Notification frequency settings
4. Advanced digest configuration
5. Notification channel preferences (email, SMS, push)
6. Custom notification templates
7. Integration webhooks management

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Data loss during migration** | High | Create backup; gradual rollout with feature flag |
| **Permission gate bypass** | High | Thorough testing of permission checks |
| **API overload** | Medium | Implement request debouncing; cache settings |
| **User confusion** | Medium | Clear UI labels; help documentation |
| **Database migration issues** | Medium | Test migration in staging; rollback plan |

---

## Success Criteria

- ✅ All portal settings accessible from admin profile
- ✅ No duplicate settings in UI
- ✅ Admin-only settings properly permission-gated
- ✅ Preferences persist across sessions
- ✅ No breaking changes to existing APIs
- ✅ All tests passing (unit, integration, E2E)
- ✅ Documentation updated
- ✅ Performance: page load < 2s, save < 1s

---

## Recommendation

**Implement Phase 1 (MVP) first:**
1. Add Preferences tab with timezone + booking notification settings
2. Test thoroughly
3. Get stakeholder approval
4. Then proceed to Phase 2 (Communication) if needed

**Defer Phase 3** (Notifications system tab) unless specifically requested.

---

## Next Steps

1. ✅ Review and approve this plan
2. Create implementation tickets
3. Update Prisma schema
4. Create PreferencesTab component
5. Create new API endpoints
6. Implement permission gates
7. Testing & QA
8. Deploy to staging
9. User acceptance testing
10. Production deployment

---

**Document Owner:** [Your Name]
**Last Updated:** 2025-10-21
**Version:** 1.0

---

## Progress Log
- 2025-10-21 14:00 UTC — ✅ Completed
  - Summary: Ran migration on staging database. Result: { created: 0, updated: 0, skipped: 0 }.
  - Notes: No BookingPreferences records present to migrate. Verified Prisma client generation succeeded.
- 2025-10-21 13:40 UTC — ✅ Completed
  - Summary: Created migration and rollback scripts to move BookingPreferences into UserProfile fields and added package scripts to run them.
  - Files Modified:
    - scripts/migrate-booking-preferences-to-user-profile.ts (new)
    - scripts/rollback-user-profile-preferences.ts (new)
    - package.json (scripts added)
  - Next Steps: Run migration on staging, verify, then production; monitor and clean up after 30 days.
- 2025-10-21 13:20 UTC — ✅ Completed
  - Summary: Added Communication tab (admin-only) with export/import/save and permission gating. Added optional Notifications tab with OfflineQueueInspector and RealtimeConnectionPanel behind feature flag. Integrated both into ProfileManagementPanel.
  - Files Modified:
    - src/components/admin/profile/CommunicationTab.tsx (new)
    - src/components/admin/profile/NotificationsTab.tsx (new)
    - src/components/admin/profile/ProfileManagementPanel.tsx (updated)
    - tests/components/preferences-tab.save.test.tsx (new)
    - tests/pages/portal-settings.redirect.test.ts (new)
  - Testing Notes: Unit tests cover preferences save and redirect behavior; manual check for permission-gated Communication tab.
- 2025-10-21 13:00 UTC — ✅ Completed
  - Summary: Updated navigation links to point to /admin/profile?tab=preferences, ensured admin profile respects tab query, and verified preferences API and redirect exist.
  - Files Modified:
    - src/components/ui/navigation.tsx
    - src/components/tax/deadline-tracker.tsx
    - src/app/admin/profile/page.tsx
  - Testing Notes: Manually verified links route to Preferences tab; redirect from /portal/settings is active; Preferences tab loads and saves via /api/user/preferences.
