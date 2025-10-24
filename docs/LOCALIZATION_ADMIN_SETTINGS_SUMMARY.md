# Localization Admin Settings - Comprehensive Enhancement Plan

**Status:** Enhancement Phase  
**Last Updated:** 2025-10-23  
**Owner:** Admin Settings Team  

---

## 📋 Executive Summary

The Localization Admin Settings module is being refactored from a **single 700+ line mega-component** into **8 modular, focused tabs** with enhanced functionality. Each tab will provide real, actionable controls for admins to manage multi-language deployments, regional configurations, and translation workflows.

### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| **Architecture** | Single `LocalizationContent.tsx` | Modular tab structure with Provider |
| **File Size** | 700+ lines in one file | ~150 lines per tab component |
| **Data Loading** | All tabs loaded upfront | Lazy load per active tab |
| **State Management** | Scattered useState | Centralized Provider context |
| **Functionality** | Basic CRUD operations | Advanced controls + automation |
| **Testing** | Hard to test monolith | Easy unit tests per tab |
| **Maintenance** | High friction | Low friction, modular |

---

## 🏗️ Architecture Overview

### Directory Structure

```
src/app/admin/settings/localization/
├── page.tsx                              # Route entry point (clean)
├── LocalizationProvider.tsx              # Centralized state & API
├── useLocalizationContext.ts             # Custom hook for state
├── types.ts                              # Shared TypeScript interfaces
├── constants.ts                          # Tab definitions & defaults
│
├── tabs/
│   ├── LanguagesTab.tsx                  # Language management (bulk ops)
│   ├── OrganizationTab.tsx               # Global settings & RTL
│   ├── UserPreferencesTab.tsx            # User adoption metrics
│   ├── RegionalFormatsTab.tsx            # Format templates & presets
│   ├── IntegrationTab.tsx                # Crowdin sync + webhooks
│   ├─��� TranslationsTab.tsx               # Coverage dashboard
│   ├── AnalyticsTab.tsx                  # Language trends & adoption
│   └── DiscoveryTab.tsx                  # Auto-audit translation keys
│
├── components/
│   ├── LanguageTable.tsx                 # Shared language table
│   ├── LanguageImportModal.tsx           # Bulk language import
│   ├── LanguageExportModal.tsx           # Bulk language export
│   ├── RegionalFormatForm.tsx            # Format template editor
│   ├── CrowdinSyncPanel.tsx              # Sync controls
│   ├── TranslationCoverageChart.tsx      # Visual coverage stats
│   ├── KeyAuditResults.tsx               # Audit findings UI
│   └── LanguageUsageChart.tsx            # Adoption trends
│
└── hooks/
    ├── useLanguages.ts                   # Language CRUD operations
    ├── useRegionalFormats.ts             # Format operations
    ├── useCrowdinIntegration.ts          # Crowdin API wrapper
    ├── useTranslationStatus.ts           # Coverage & metrics
    └── useLanguageAnalytics.ts           # Usage data & trends
```

---

## 📑 Tab Specifications

### 1. **Languages & Availability Tab**

**Purpose:** Manage which languages are available on the platform

**Real Functions:**
- ✅ Add/Edit/Delete languages with validation
- ✅ **NEW: Bulk import languages from JSON/CSV file**
- ✅ **NEW: Bulk export current languages for backup**
- ✅ **NEW: Set language as "featured" (appears in switcher)**
- ✅ **NEW: Enable/disable languages without deletion**
- ✅ **NEW: Language activity heatmap** (shows usage over time)
- ✅ **NEW: Duplicate language config** (copy from another language)
- ✅ **NEW: Auto-detect from browser header** (test feature)
- ✅ Permission-based access (LANGUAGES_MANAGE)

**Admin Controls:**
```
┌─────────────────────────────────────┐
│ Languages & Availability            │
├─────────────────────────────────────┤
│ [Add Language] [Import] [Export]    │
├─────────────────────────────────────┤
│ Code │ Name      │ Status│ Featured│
├─────┼──────────┼────────┼─────────┤
│ en   │ English   │ ✓ On  │ ⭐      │
│ ar   │ العربية   │ ✓ On  │ ⭐      │
│ fr   │ Français  │ ✗ Off │         │
└─────┴──────────┴────────┴─────────┘

Heatmap: [Language usage over last 30 days]
```

**API Endpoints:**
- `GET /api/admin/languages` - list all
- `POST /api/admin/languages` - create
- `PUT /api/admin/languages/:code` - update
- `DELETE /api/admin/languages/:code` - delete
- `PATCH /api/admin/languages/:code/toggle` - enable/disable
- **NEW: `POST /api/admin/languages/import`** - bulk import
- **NEW: `GET /api/admin/languages/export`** - bulk export
- **NEW: `GET /api/admin/languages/:code/activity`** - usage heatmap

---

### 2. **Organization Settings Tab**

**Purpose:** Configure organization-wide language behavior

**Real Functions:**
- ✅ Set default language (for new users)
- ✅ Set fallback language (when translation missing)
- ✅ **NEW: Language switcher visibility toggle** (show/hide for clients)
- ✅ **NEW: Persist language preference** (remember user's choice)
- ✅ **NEW: Auto-detect browser language** (smart default)
- ✅ **NEW: RTL mode enforcement** (auto-apply for ar, he)
- ✅ **NEW: Missing translation behavior** (show key / fallback / empty)
- ✅ **NEW: Preview settings in real-time** (live demo)

**Admin Controls:**
```
┌──────────────────────────────────────┐
│ Organization Settings                │
├──────────────────────────────────────┤
│ Default Language: [English ▼]         │
│ Fallback Language: [English ▼]        │
│                                      │
│ ☑ Show language switcher to clients  │
│ ☑ Auto-detect browser language       │
│ ☑ Persist user language preference   │
│ ☑ Auto-apply RTL for RTL languages   │
│                                      │
│ Missing Translation Behavior:         │
│ ○ Show key (hero.headline)            │
│ ○ Show fallback translation           │
│ ● Show empty string                   │
│                                      │
│ [Preview Settings] [Save]             │
└──────────────────────────────────────┘
```

**API Endpoints:**
- `GET /api/admin/org-settings/localization` - read
- `PUT /api/admin/org-settings/localization` - update
- **NEW: `POST /api/admin/org-settings/localization/preview`** - test settings

---

### 3. **User Language Control Tab**

... (content unchanged up to Action Log)

## 📜 Action Log

- ✅ 2025-10-24: Implemented manual Crowdin sync endpoint and wired IntegrationTab "Sync Now" action.
  - Summary: Added POST /api/admin/crowdin-integration/sync to trigger a sync and update lastSyncAt/lastSyncStatus. Updated IntegrationTab to call the new endpoint and refresh status.
  - Files Modified:
    - src/app/api/admin/crowdin-integration/sync/route.ts (new)
    - src/app/admin/settings/localization/tabs/IntegrationTab.tsx (added manualSync, updated button handler)
    - src/app/api/admin/crowdin-integration/route.ts (import fix for withTenantContext)
  - Testing: Updated unit test IntegrationTab "allows triggering manual sync" passes; verified button calls POST /api/admin/crowdin-integration/sync and UI reflects latest sync metadata.
