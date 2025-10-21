# Manage Profile Integration Plan
## Audit & Design Document

**Date Created:** 2025-01-XX  
**Status:** Ready for Review  
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

### Phase 1: Foundation (MVP)
**Priority:** HIGH  
**Timeline:** 1-2 weeks

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

### Phase 2: Communication Settings (Optional)
**Priority:** MEDIUM  
**Timeline:** 2-3 weeks
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
**Permission Gate:** Optional (feature flag)

**Tasks:**
1. Move OfflineQueueInspector & RealtimeConnectionPanel to Notifications tab
2. Add debug info toggle
3. Feature flag for production visibility

**Deliverable:** Optional "Notifications" system tab

---

## Data Flow Architecture

```
┌───────────────────���─────────────────────────────────────────────┐
│                     Manage Profile Page                         │
│                      /admin/profile                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
    │  Profile   │ │Security │ │Preferences │
    │   Tab      │ │  Tab    │ │   Tab      │
    └─────┬──────┘ └──┬──────┘ └──┬─────────┘
          │           │            │
    ┌─────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
    │ /api/user/ │ │/api/user│ │ /api/user/  │
    │  profile   │ │/security│ │preferences  │
    └──────���─────┘ └─────────┘ └─────────────┘
          │           │            │
    ┌─────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
    │  User DB   │ │ User DB  │ │UserProfile  │
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
    ┌──────────▼──────────────────┐
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
│   └── LocalizationSection
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

## Migration Path for Existing Users

### Consideration
If users currently have data in portal settings, need to:
1. Migrate existing preferences to new schema
2. Ensure backward compatibility during transition
3. Update portal settings page to redirect to admin profile

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
**Last Updated:** 2025-01-XX  
**Version:** 1.0
