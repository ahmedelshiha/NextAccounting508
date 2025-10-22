# Localization & Language Control — Complete Audit + Implementation Tasks

**Last updated:** 2025-10-24  
**Author:** Comprehensive Audit Report  
**Status:** All P0/P1/P2/P3 tasks completed; full audit completed

---

## 1. Executive Summary

This document consolidates the complete audit of localization and language control systems, current implementation status, security findings, and recommendations for future improvements. The codebase uses a **custom i18n implementation** (no third-party frameworks like i18next or react-intl) with **per-locale JSON files**, **React Context**, and **database-backed user preferences** for timezone and language selection.

**Current Status:** ✅ All critical and high-priority tasks are implemented and tested. System is production-ready with proper validation, rate-limiting, and monitoring.

---

## 2. Architecture Overview

### 2.1 Core Components

The localization system is composed of:

1. **Translation Context & Hook** (`src/lib/i18n.ts`)
   - `TranslationContext`: React Context storing locale, translations, and setLocale function
   - `useTranslations()`: Hook providing `t(key, params)` function, locale, setLocale, and document direction
   - Supports three languages: `en` (English, LTR), `ar` (Arabic, RTL), `hi` (Hindi, LTR)

2. **Translation Provider** (`src/components/providers/translation-provider.tsx`)
   - Client-side component that loads translations dynamically on locale change
   - Persists locale choice to localStorage
   - Updates document direction (`dir`) and language (`lang`) attributes
   - Toggles `rtl` CSS class on body for RTL styling support

3. **Locale JSON Dictionaries** (`src/app/locales/*.json`)
   - `en.json`: English translations (baseline reference)
   - `ar.json`: Arabic translations (RTL support)
   - `hi.json`: Hindi translations
   - All keys present in baseline; parity enforced by test scripts

4. **Locale Utilities** (`src/lib/locale.ts`)
   - `getBCP47Locale()`: Maps short codes to BCP47 locales for Intl API (e.g., `en` → `en-US`)
   - `getSupportedLanguages()`: Returns array of supported language codes
   - `isSupportedLanguage()`: Type-safe language validation

5. **User Preferences API** (`src/app/api/user/preferences/route.ts`)
   - `GET /api/user/preferences`: Fetch user's timezone, language, and notification preferences
   - `PUT /api/user/preferences`: Update preferences with validation and rate-limiting

6. **Database Schema** (`prisma/schema.prisma`)
   - `UserProfile.timezone`: IANA timezone string (default: `UTC`)
   - `UserProfile.preferredLanguage`: Language code (default: `en`)
   - `UserProfile.reminderHours`: Integer array for reminder times (default: `[24, 2]`)

---

## 3. Detailed Implementation Findings

### 3.1 Supported Languages

Currently supported languages (hardcoded in `src/lib/i18n.ts`):

```typescript
export const locales = ['en', 'ar', 'hi'] as const
```

| Code | Language | Direction | Native Name | Flag |
|------|----------|-----------|------------|------|
| `en` | English | LTR | English | 🇺🇸 |
| `ar` | Arabic | RTL | العربية | 🇸🇦 |
| `hi` | Hindi | LTR | हिन्दी | 🇮🇳 |

**Locale Mapping (BCP47):**
- `en` → `en-US` (for Intl formatting)
- `ar` → `ar-SA` (for Intl formatting)
- `hi` → `hi-IN` (for Intl formatting)

### 3.2 Translation System

**Key-Value Lookup with Parameter Substitution:**

```typescript
const t = (key: string, params?: Record<string, string | number>) => {
  let translation = context.translations[key] || key
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{{${param}}}`, String(value))
    })
  }
  return translation
}
```

**Example Usage:**
```json
// en.json
{ "footer.copyright": "© {{year}} Accounting Firm. All rights reserved." }

// Component
t('footer.copyright', { year: 2025 })
// Output: "© 2025 Accounting Firm. All rights reserved."
```

**Supported Features:**
- Simple key-value translations ✅
- Parameter substitution (via `{{param}}` syntax) ✅
- RTL support (document.dir, CSS class) ✅
- localStorage persistence ✅
- Browser language detection ✅

**Limitations:**
- ❌ Pluralization (requires external library or custom system)
- ❌ Gender agreement in translations
- ❌ Advanced formatting rules
- ❌ Namespace support (all keys in single flat object)

### 3.3 Client-Side Implementation

**TranslationProvider:**
- Loads translations async on locale change
- Avoids hydration mismatch by rendering children while loading
- Updates `document.documentElement.dir` and `.lang` for accessibility
- Toggles `body.rtl` class for CSS RTL support

**useTranslations Hook:**
- Used throughout UI components
- Returns `t`, `locale`, `setLocale`, and `dir`
- Must be called from client components (`'use client'`)

**Language Switcher** (`src/components/ui/language-switcher.tsx`):
- Dropdown or tab-based interface for switching languages
- Two variants: `default` (inline buttons) and `compact` (dropdown menu)
- Shows current language with checkmark indicator
- Calls `setLocale()` to update context, localStorage, and document attributes

### 3.4 User Preferences - Database & API

**Database Schema (UserProfile):**
```prisma
model UserProfile {
  timezone            String?   @default("UTC")
  preferredLanguage   String?   @default("en")
  bookingEmailConfirm      Boolean?  @default(true)
  bookingEmailReminder     Boolean?  @default(true)
  bookingEmailReschedule   Boolean?  @default(true)
  bookingEmailCancellation Boolean?  @default(true)
  bookingSmsReminder       Boolean?  @default(false)
  bookingSmsConfirmation   Boolean?  @default(false)
  reminderHours            Int[]     @default([24, 2])
}
```

**API Endpoint: GET /api/user/preferences**
- Returns user's stored preferences with fallback defaults
- Rate-limited: 60 requests/minute per IP
- Requires authenticated tenant context
- Error handling: Returns safe defaults if DB not configured

**API Endpoint: PUT /api/user/preferences**
- Validates input via Zod schema (`PreferencesSchema`)
- Rate-limited: 20 writes/minute per IP + 40 writes/minute per user
- Additional validation:
  - `timezone`: Validated using Intl.DateTimeFormat (IANA timezone strings)
  - `preferredLanguage`: Enum validation (`'en' | 'ar' | 'hi'`)
  - `reminderHours`: Numeric array with range 1-720 hours
- Coerces reminderHours to proper numeric array (avoids Prisma type errors)
- Returns updated preferences after upsert

**Validation Schema (Zod):**
```typescript
export const PreferencesSchema = z.object({
  timezone: z.string().min(1).max(100).default('UTC'),
  preferredLanguage: z.enum(['en', 'ar', 'hi']).default('en'),
  bookingEmailConfirm: z.boolean().default(true),
  bookingEmailReminder: z.boolean().default(true),
  bookingEmailReschedule: z.boolean().default(true),
  bookingEmailCancellation: z.boolean().default(true),
  bookingSmsReminder: z.boolean().default(false),
  bookingSmsConfirmation: z.boolean().default(false),
  reminderHours: z.array(z.number().min(1).max(720)).default([24, 2]),
})
```

### 3.5 Client-Side UI for Preferences

**LocalizationTab** (`src/components/admin/profile/LocalizationTab.tsx`):
- User-facing UI for timezone and language selection
- Located in admin/profile settings
- Features:
  - Timezone selector with searchable dropdown
  - Language selector with native labels
  - Inline field-level error display
  - Client-side validation before submission
  - Loading and error states

**useUserPreferences Hook** (`src/hooks/useUserPreferences.ts`):
- SWR-based caching with 1-minute dedup interval
- Optimistic updates with proper rollback on error
- Handles 500 errors gracefully with schema defaults
- Prevents duplicate API calls across components

---

## 4. Security & Validation Analysis

### 4.1 Input Validation ✅

| Field | Validation Method | Restrictions |
|-------|------------------|----------------|
| `preferredLanguage` | Zod enum | Must be `'en'`, `'ar'`, or `'hi'` |
| `timezone` | Intl.DateTimeFormat + Zod | Must be valid IANA timezone; length 1-100 chars |
| `reminderHours` | Zod numeric array | Each value: 1-720 hours (1 min to 30 days) |
| Other boolean fields | Zod boolean | Type-enforced |

**Server-Side Validation:**
```typescript
// Timezone validation using Intl API
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// Supports 400+ IANA timezones; falls back to common list for older browsers
export function getAvailableTimezones(): string[] {
  if (typeof (Intl as any).supportedValuesOf === 'function') {
    return ((Intl as any).supportedValuesOf('timeZone') as string[]).sort()
  }
  return getCommonTimezones() // 40+ fallback timezones
}
```

### 4.2 Rate Limiting ✅

Implemented on `PUT /api/user/preferences`:
- **Per-IP limit:** 20 writes/minute (prevents abuse from single IP)
- **Per-user limit:** 40 writes/minute (prevents false positives on shared IPs)
- Rate-limit hits logged to Sentry with breadcrumbs
- Returns HTTP 429 when exceeded

### 4.3 Payload Sanitization ✅

Logging sanitization prevents PII leakage:
```typescript
function sanitizePayloadForLogging(payload: Record<string, any>): Record<string, any> {
  const allowedFields = [
    'timezone', 'preferredLanguage', 'bookingEmailConfirm', 'bookingEmailReminder',
    'bookingEmailReschedule', 'bookingEmailCancellation', 'bookingSmsReminder',
    'bookingSmsConfirmation'
  ]
  const sanitized: Record<string, any> = {}
  for (const field of allowedFields) {
    if (field in payload) sanitized[field] = payload[field]
  }
  return sanitized
}
```

All Sentry captures and console.error calls use sanitized payloads.

### 4.4 Sentry Monitoring ✅

Breadcrumbs added for observability:
- **Info level:** Successful preference updates and fetches
- **Warning level:** Validation failures, rate-limit hits, user not found
- **Error level:** Database upsert failures

Example breadcrumb:
```typescript
Sentry.addBreadcrumb({
  category: 'user.preferences',
  message: 'User preferences updated',
  level: 'info',
  data: {
    userId: user.id,
    tenantId: tid,
    fieldsUpdated: Object.keys(validationResult.data),
    success: true,
  },
})
```

### 4.5 Identified Security Gaps & Risks

#### 🟡 Medium Priority Risks

1. **Hardcoded Language Enum**
   - Risk: Language list is hardcoded; adding new languages requires code changes
   - Mitigation: Language expansion requires:
     - Adding to `locales` array in `src/lib/i18n.ts`
     - Adding translation JSON file to `src/app/locales/`
     - Updating BCP47 mapping in `src/lib/locale.ts`
     - Updating Zod enum in `src/schemas/user-profile.ts`
     - Updating UI constants in `src/components/admin/profile/constants.ts`
   - **Recommendation:** For production with >5 languages, consider:
     - Data-driven language config (JSON file or database table)
     - Admin interface for adding new languages
     - Integration with translation platform (Crowdin, Lokalise, etc.)

2. **Timezone Selection UX Risk**
   - Risk: No timezone offset/city context in dropdown; users may select wrong timezone
   - Current: Shows raw IANA codes (e.g., `America/New_York`)
   - Mitigation: Fallback list only contains common timezones; Intl API used when available
   - **Recommendation:** Integrate timezone library (moment-timezone, date-fns-tz) to show:
     - Current offset from UTC
     - Major city examples
     - Searchable interface with fuzzy matching

3. **No Pluralization Support**
   - Risk: Complex translations requiring pluralization not supported
   - Current: Simple key-value with parameter substitution
   - **Recommendation:** If needed, integrate i18next or Lingui for advanced patterns

4. **Server-Side Translation Loading**
   - Risk: Translations are loaded client-side only; server-side rendering may need translations for critical content
   - Current: App layout provides `initialLocale` to avoid hydration mismatch
   - **Recommendation:** For SSR translations, implement server-side loader:
     - Load translations on server during render
     - Pass via props to client components
     - Avoids flash of untranslated content

#### 🟢 Low Priority / Non-Issues

5. **LocalStorage Persistence**
   - Not a risk; proper use of localStorage for user preference caching
   - RTL support properly handled via document attributes
   - Browser language detection as fallback

6. **Rate Limiting**
   - Properly implemented with both per-IP and per-user limits
   - Sentry monitoring in place

7. **Database Defaults**
   - Schema defaults are sensible (UTC, English, standard notification preferences)

---

## 5. Test Coverage & Quality

### 5.1 Existing Tests

Tests are implemented for:
- ✅ API preferences endpoint (GET/PUT) - success, 400, 404, 429, 500 scenarios
- ✅ Client validation in LocalizationTab
- ✅ Timezone validation via Intl API
- ✅ Language enum validation
- ✅ SWR hook error handling and rollback
- ✅ Rate limiting behavior
- ✅ Payload sanitization

Test files:
- `tests/api/user-preferences.test.ts`
- `tests/api/user-preferences.extra.test.ts`
- `tests/components/localization-save.test.tsx`

### 5.2 Test-i18n Script

Script available: `scripts/test-i18n.ts`
- Validates translation key parity across locales
- Ensures no missing keys between en.json, ar.json, hi.json
- Should run in CI/CD to prevent parity regressions

---

## 6. Implementation Status & Deployment Checklist

### ✅ All Tasks Completed

#### P0 — Critical (3/3 completed)
- ✅ P0-1: Server-side reminderHours coercion and validation
- ✅ P0-2: Client-side validation in LocalizationTab
- ✅ P0-3: Comprehensive test coverage (API + component)

#### P1 — High Priority (3/3 completed)
- ✅ P1-1: SWR hook improvements with proper rollback
- ✅ P1-2: API hardening with sanitization & per-user rate limiting
- ✅ P1-3: Locale mapping utility for BCP47 formatting

#### P2 — Medium Priority (3/3 completed)
- ✅ P2-1: Inline field errors in LocalizationTab
- ✅ P2-2: Documentation updates
- ✅ P2-3: Sentry breadcrumbs and monitoring

#### P3 — Optional (1/1 completed)
- ✅ P3-1: Admin support view for user locales (permission-gated)

### Deployment Checklist

- [x] Server validation for preferences
- [x] Client-side validation in LocalizationTab
- [x] Test coverage for API and components
- [x] SWR error handling improvements
- [x] Rate limiting configuration
- [x] Payload sanitization for logging
- [x] Locale/language formatting for emails
- [x] Inline field error messages
- [x] Sentry monitoring enhancements
- [x] Admin support view

**Status:** All items ready for production deployment.

---

## 7. File Structure Reference

### Core Implementation Files

```
src/
  lib/
    i18n.ts                              # Translation context, useTranslations hook, formatting utilities
    locale.ts                            # getBCP47Locale(), language validation
    cron/
      reminders.ts                       # Uses getBCP47Locale() for email/SMS formatting
  components/
    providers/
      translation-provider.tsx           # TranslationProvider, loads translations dynamically
    ui/
      language-switcher.tsx              # Language selection UI (default/compact variants)
    admin/
      profile/
        LocalizationTab.tsx              # User timezone/language selection UI
        constants.ts                     # Language, timezone, validation constants
    admin/
      support/
        UserLocaleView.tsx               # Permission-gated admin support view (P3-1)
  app/
    locales/
      en.json                            # English translations (4000+ keys)
      ar.json                            # Arabic translations (RTL)
      hi.json                            # Hindi translations
    api/
      user/
        preferences/
          route.ts                       # GET/PUT /api/user/preferences
    layout.tsx                           # Wraps app with TranslationProvider
  hooks/
    useUserPreferences.ts                # SWR hook for preferences caching/update
  schemas/
    user-profile.ts                      # PreferencesSchema, isValidTimezone(), timezone utilities

prisma/
  schema.prisma                          # UserProfile model with locale/timezone fields

tests/
  api/
    user-preferences.test.ts             # Comprehensive API tests
    user-preferences.extra.test.ts       # Additional scenario tests
  components/
    localization-save.test.tsx           # UI component tests

scripts/
  test-i18n.ts                           # Validates translation parity
```

---

## 8. Future Improvements & Roadmap

### Phase 2: Multi-Language Support (6+ languages)

**Recommended Changes:**

1. **Data-Driven Language Config**
   - Move language definitions to a JSON file or database table
   - Admin interface to enable/disable languages
   - Reduces code changes needed for new languages

2. **Translation Platform Integration**
   - Consider Crowdin, Lokalise, or similar for translation management
   - CI/CD integration to auto-sync translations
   - Collaborative translation workflow

3. **Enhanced Timezone UX**
   - Integrate `date-fns-tz` or `moment-timezone` for offsets and city examples
   - Searchable, fuzzy-match timezone selector
   - Remember user's timezone across devices

### Phase 3: Advanced i18n Patterns

1. **Pluralization Support**
   - Integrate i18next or Lingui for plural rules per language
   - Example: `{{count}} item` vs `{{count}} items`

2. **Gender Agreement**
   - Support gender-aware translations (e.g., Arabic adjectives)
   - Example: `greeting.welcome.male` vs `greeting.welcome.female`

3. **Date/Time Formatting**
   - Move format strings to translation files
   - Let translators customize date formats per locale

### Phase 4: SSR Translations

1. **Server-Side Translation Loading**
   - Load translations on server during render
   - Pass via props to avoid hydration mismatch
   - Eliminates flash of untranslated content for users with slow client-side loading

---

## 9. Security Audit Recommendations Summary

| Finding | Severity | Status | Action |
|---------|----------|--------|--------|
| Hardcoded language enum | Medium | Open | Plan Phase 2 multi-language approach |
| Timezone UX (no offsets shown) | Medium | Mitigated | Fallback list; Intl API used when available |
| No pluralization | Low | Open | Consider i18next integration if needed |
| SSR translations | Low | Open | Implement server-side loader for critical content |
| Rate limiting | - | ✅ Complete | Dual per-IP and per-user limits |
| Payload sanitization | - | ✅ Complete | Non-PII fields logged only |
| Timezone validation | - | ✅ Complete | Intl API with fallback list |
| Language enum validation | - | ✅ Complete | Zod validation + constants |
| DB defaults | - | ✅ Complete | Sensible (UTC, en, standard preferences) |

---

## 10. Usage Examples

### Add a New Language (Current Approach)

1. Create translation file: `src/app/locales/fr.json`
2. Update `src/lib/i18n.ts`:
   ```typescript
   export const locales = ['en', 'ar', 'hi', 'fr'] as const
   export const localeConfig = {
     // ... existing
     fr: { name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' }
   }
   ```

3. Update `src/lib/locale.ts`:
   ```typescript
   const languageToBCP47Map = {
     // ... existing
     fr: 'fr-FR'
   }
   ```

4. Update `src/schemas/user-profile.ts`:
   ```typescript
   preferredLanguage: z.enum(['en', 'ar', 'hi', 'fr'])
   ```

5. Update `src/components/admin/profile/constants.ts`:
   ```typescript
   export const LANGUAGES = [
     { code: 'en', label: 'English' },
     { code: 'ar', label: 'العربية' },
     { code: 'hi', label: 'हिन्दी' },
     { code: 'fr', label: 'Français' },
   ]
   ```

6. Run test: `npm run test:i18n`

### Use Translations in a Component

```typescript
'use client'

import { useTranslations } from '@/lib/i18n'

export function MyComponent() {
  const { t, locale } = useTranslations()

  return (
    <div>
      <h1>{t('hero.headline')}</h1>
      <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      <small>Current locale: {locale}</small>
    </div>
  )
}
```

### Format Numbers/Currency/Dates

```typescript
import { formatNumber, formatCurrency, formatDate } from '@/lib/i18n'

const { locale } = useTranslations()

formatNumber(1234.56, locale) // "1,234.56" (en-US) or "1 234,56" (other locales)
formatCurrency(99.99, locale, 'USD') // "$99.99"
formatDate(new Date(), locale, { month: 'long', day: 'numeric' })
```

### Fetch User Preferences

```typescript
import { useUserPreferences } from '@/hooks/useUserPreferences'

export function ProfilePage() {
  const { preferences, loading, error, updatePreferences } = useUserPreferences()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <p>Timezone: {preferences?.timezone}</p>
      <p>Language: {preferences?.preferredLanguage}</p>
      <button onClick={() => updatePreferences({ preferredLanguage: 'ar' })}>
        Switch to Arabic
      </button>
    </div>
  )
}
```

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **BCP47** | Language tag format (e.g., `en-US`, `ar-SA`) used by Intl APIs |
| **IANA Timezone** | Standard timezone identifier (e.g., `America/New_York`, `UTC`) |
| **Locale** | Combination of language + region (e.g., `en-US`) |
| **LTR** | Left-to-Right text direction (English, Hindi) |
| **RTL** | Right-to-Left text direction (Arabic, Hebrew) |
| **i18n** | Internationalization (preparing app for multiple languages) |
| **l10n** | Localization (translating for specific language/region) |
| **SWR** | Stale-While-Revalidate caching strategy |

---

## 12. Questions & Support

**Q: How do I add a new language?**
A: See Section 10 "Usage Examples — Add a New Language". Requires changes to 5 files + new translation JSON.

**Q: How do I change the default language?**
A: Update `defaultLocale` in `src/lib/i18n.ts` and app layout's initial locale.

**Q: How do I verify all translations are present?**
A: Run `npm run test:i18n` to check parity between all locale JSON files.

**Q: How do I report a translation error?**
A: Update the key in the relevant `src/app/locales/*.json` file and ensure parity with other locales.

**Q: Why is my timezone selector showing too many options?**
A: Intl.supportedValuesOf returns 400+ timezones. UX improvement: integrate timezone library with offsets/cities.

---

## 13. Audit Summary

**Audit Scope:** Full codebase review of localization implementation, security, validation, and data handling.

**Audit Method:**
- File-by-file review of core i18n files
- API endpoint security analysis
- Database schema validation
- Client-side validation flow
- Rate-limiting and monitoring
- Test coverage assessment

**Key Findings:**
- ✅ Comprehensive custom i18n system with proper validation
- ✅ Strong security posture: rate-limiting, payload sanitization, Sentry monitoring
- ✅ Excellent test coverage for critical paths
- ✅ RTL support properly implemented
- 🟡 Hardcoded language enum (manageable for Phase 1; plan data-driven approach for Phase 2)
- 🟡 Timezone UX could be improved with offsets/cities
- 🟢 No critical security gaps identified

**Overall Assessment:** **PRODUCTION READY** ✅

All critical security controls, validation, and error handling are in place. System is well-tested and properly monitored. Ready for deployment.

---

**End of Audit Document**
