# Localization Admin Settings - API Reference

**Version:** 1.0  
**Base URL:** `/api/admin`  
**Authentication:** Required (via NextAuth session)  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Languages](#languages)
2. [Organization Settings](#organization-settings)
3. [Regional Formats](#regional-formats)
4. [Crowdin Integration](#crowdin-integration)
5. [Translations](#translations)
6. [Analytics](#analytics)
7. [Error Handling](#error-handling)

---

## Languages

### List All Languages

```
GET /languages
```

**Description:** Retrieve all configured languages

**Query Parameters:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English",
      "direction": "ltr",
      "flag": "🇺🇸",
      "bcp47Locale": "en-US",
      "enabled": true,
      "featured": true
    }
  ]
}
```

**Error (403):**
```json
{
  "error": "Insufficient permissions",
  "requiredPermission": "LANGUAGES_VIEW"
}
```

---

### Create Language

```
POST /languages
```

**Description:** Add a new language to the system

**Request Body:**
```json
{
  "code": "de",
  "name": "German",
  "nativeName": "Deutsch",
  "direction": "ltr",
  "flag": "🇩🇪",
  "bcp47Locale": "de-DE",
  "enabled": true,
  "featured": false
}
```

**Required Fields:** `code`, `name`, `nativeName`, `direction`, `bcp47Locale`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "code": "de",
    "name": "German",
    ...
  }
}
```

**Error (400):**
```json
{
  "error": "Language code already exists"
}
```

**Error (403):**
```json
{
  "error": "Insufficient permissions",
  "requiredPermission": "LANGUAGES_MANAGE"
}
```

---

### Update Language

```
PUT /languages/:code
```

**Description:** Update an existing language

**URL Parameters:**
- `code` (string): Language code (e.g., "en")

**Request Body:**
```json
{
  "name": "English (Updated)",
  "featured": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated language */ }
}
```

**Error (404):**
```json
{
  "error": "Language not found"
}
```

---

### Delete Language

```
DELETE /languages/:code
```

**Description:** Delete a language and its translations

**Response (200):**
```json
{
  "success": true,
  "message": "Language deleted"
}
```

**Warning:** This action is irreversible and deletes all translations for this language.

---

### Toggle Language Status

```
PATCH /languages/:code/toggle
```

**Description:** Enable or disable a language

**Response (200):**
```json
{
  "success": true,
  "data": {
    "code": "en",
    "enabled": false
  }
}
```

---

### Import Languages (Bulk)

```
POST /languages/import
```

**Description:** Import multiple languages from a JSON file

**Request Body (multipart/form-data):**
```
file: [JSON file with language array]
```

**JSON File Format:**
```json
[
  {
    "code": "de",
    "name": "German",
    "nativeName": "Deutsch",
    "direction": "ltr",
    "bcp47Locale": "de-DE",
    "enabled": true,
    "featured": true
  }
]
```

**Response (200):**
```json
{
  "success": true,
  "imported": 3,
  "failed": 0,
  "message": "Successfully imported 3 languages"
}
```

**Error (400):**
```json
{
  "error": "Invalid JSON format",
  "details": "Expected array of language objects"
}
```

---

### Export Languages

```
GET /languages/export
```

**Description:** Export all languages as JSON file

**Query Parameters:**
- `format` (optional): `json` or `csv` (default: `json`)

**Response (200):**
```
Content-Type: application/json
Content-Disposition: attachment; filename="languages.json"

[
  { /* language objects */ }
]
```

---

### Get Language Activity Heatmap

```
GET /languages/:code/activity
```

**Description:** Get usage statistics for a language over time

**Query Parameters:**
- `days` (optional): Number of days to report (default: 30)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "language": "en",
    "period": 30,
    "dailyStats": [
      { "date": "2025-10-01", "users": 450, "sessions": 650 },
      { "date": "2025-10-02", "users": 475, "sessions": 680 }
    ],
    "totalUsers": 5432,
    "averageDailyUsers": 450
  }
}
```

---

## Organization Settings

### Get Organization Settings

```
GET /org-settings/localization
```

**Description:** Retrieve organization-wide localization settings

**Response (200):**
```json
{
  "success": true,
  "data": {
    "defaultLanguage": "en",
    "fallbackLanguage": "en",
    "showLanguageSwitcher": true,
    "persistLanguagePreference": true,
    "autoDetectBrowserLanguage": true,
    "allowUserLanguageOverride": true,
    "enableRtlSupport": true,
    "missingTranslationBehavior": "show-fallback"
  }
}
```

---

### Update Organization Settings

```
PUT /org-settings/localization
```

**Description:** Update organization settings

**Request Body:**
```json
{
  "defaultLanguage": "es",
  "showLanguageSwitcher": true,
  "missingTranslationBehavior": "show-empty"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated settings */ }
}
```

**Error (400):**
```json
{
  "error": "Invalid default language code"
}
```

---

### Preview Settings

```
POST /org-settings/localization/preview
```

**Description:** Test how settings would look before saving

**Request Body:**
```json
{
  "defaultLanguage": "es",
  "showLanguageSwitcher": false
}
```

**Response (200):**
```json
{
  "success": true,
  "preview": {
    "defaultLanguage": "Spanish",
    "showLanguageSwitcher": false,
    "estimatedImpact": "5,432 users affected"
  }
}
```

---

## Regional Formats

### Get All Regional Formats

```
GET /regional-formats
```

**Description:** Retrieve date, time, and currency formats for all languages

**Response (200):**
```json
{
  "success": true,
  "data": {
    "en": {
      "language": "en",
      "dateFormat": "MM/DD/YYYY",
      "timeFormat": "hh:mm A",
      "currencyCode": "USD",
      "currencySymbol": "$",
      "numberFormat": "#,##0.00",
      "decimalSeparator": ".",
      "thousandsSeparator": ","
    }
  }
}
```

---

### Update Regional Format

```
PUT /regional-formats
```

**Description:** Update format settings for a language

**Request Body:**
```json
{
  "language": "de",
  "dateFormat": "DD.MM.YYYY",
  "timeFormat": "HH:mm",
  "currencyCode": "EUR",
  "currencySymbol": "€",
  "decimalSeparator": ",",
  "thousandsSeparator": "."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated format */ }
}
```

---

### Validate Format

```
POST /regional-formats/validate
```

**Description:** Test if a format is valid before saving

**Request Body:**
```json
{
  "dateFormat": "DD/MM/YYYY",
  "testDate": "2025-12-25"
}
```

**Response (200):**
```json
{
  "valid": true,
  "parsed": "25/12/2025",
  "message": "Format is valid"
}
```

**Error (400):**
```json
{
  "valid": false,
  "error": "Invalid date format pattern"
}
```

---

### Import CLDR Templates

```
POST /regional-formats/import-cldr
```

**Description:** Auto-populate formats from Unicode CLDR standards

**Request Body:**
```json
{
  "language": "de",
  "region": "DE"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dateFormat": "DD.MM.YYYY",
    "timeFormat": "HH:mm",
    "currencyCode": "EUR",
    "currencySymbol": "€"
  }
}
```

---

## Crowdin Integration

### Get Crowdin Settings

```
GET /crowdin-integration
```

**Description:** Retrieve Crowdin project configuration

**Response (200):**
```json
{
  "success": true,
  "data": {
    "projectId": "project-123",
    "autoSyncDaily": true,
    "syncOnDeploy": true,
    "createPrs": true,
    "lastSyncAt": "2025-10-23T10:30:00Z",
    "lastSyncStatus": "success",
    "testConnectionOk": true
  }
}
```

---

### Save Crowdin Settings

```
POST /crowdin-integration
```

**Description:** Save or update Crowdin configuration

**Request Body:**
```json
{
  "projectId": "project-123",
  "apiToken": "secret-token",
  "autoSyncDaily": true,
  "syncOnDeploy": true,
  "createPrs": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Crowdin settings saved"
}
```

---

### Test Crowdin Connection

```
PUT /crowdin-integration
```

**Description:** Test connection to Crowdin API

**Request Body:**
```json
{
  "projectId": "project-123",
  "apiToken": "secret-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connection successful",
  "projectName": "My Project",
  "languages": 5
}
```

**Error (401):**
```json
{
  "error": "Invalid Crowdin credentials"
}
```

---

### Trigger Manual Sync

```
POST /crowdin-integration/sync
```

**Description:** Immediately pull translations from Crowdin

**Request Body:**
```json
{}
```

**Response (202):**
```json
{
  "success": true,
  "syncId": "sync-abc123",
  "message": "Sync started",
  "estimatedTime": "5 minutes"
}
```

---

### Get Sync Status

```
GET /crowdin-integration/status
```

**Description:** Check status of last sync

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "lastSyncAt": "2025-10-23T10:30:00Z",
    "keysAdded": 12,
    "keysUpdated": 45,
    "errors": []
  }
}
```

---

### Get Project Health

```
GET /crowdin-integration/project-health
```

**Description:** Get translation completion percentage per language

**Response (200):**
```json
{
  "success": true,
  "data": {
    "en": 100,
    "ar": 92,
    "hi": 78,
    "fr": 85
  }
}
```

---

### Get Sync Logs

```
GET /crowdin-integration/logs
```

**Description:** Retrieve audit trail of all sync operations

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 10)
- `skip` (optional): Offset for pagination (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-123",
      "syncedAt": "2025-10-23T10:30:00Z",
      "status": "success",
      "keysAdded": 12,
      "keysUpdated": 45,
      "duration": "4m 32s",
      "error": null
    }
  ]
}
```

---

## Translations

### Get Translation Status

```
GET /translations/status
```

**Description:** Get translation coverage summary

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalKeys": 1247,
      "enCoveragePct": "100%",
      "arCoveragePct": "92%",
      "hiCoveragePct": "78%"
    }
  }
}
```

---

### Get Missing Keys

```
GET /translations/missing
```

**Description:** Get list of untranslated keys by language

**Query Parameters:**
- `language` (optional): Filter by language code
- `category` (optional): Filter by feature/category
- `limit` (optional): Number of results (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "key": "payment.success.message",
      "arTranslated": false,
      "hiTranslated": false,
      "priority": "high"
    }
  ]
}
```

---

### Mark Key as Priority

```
POST /translations/priority
```

**Description:** Flag a translation key for priority translation

**Request Body:**
```json
{
  "key": "payment.success.message",
  "priority": "high"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Key marked as priority"
}
```

---

### Get Translation Velocity

```
GET /translations/velocity
```

**Description:** Get translation rate metrics

**Query Parameters:**
- `days` (optional): Period in days (default: 7)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": 7,
    "keysAdded": 45,
    "keysTranslated": 156,
    "velocity": "22 keys/day",
    "trend": "up"
  }
}
```

---

## Key Discovery

### Run Discovery Audit

```
POST /translations/discover
```

**Description:** Scan codebase for all translation keys

**Request Body:**
```json
{
  "validateNaming": true
}
```

**Response (202):**
```json
{
  "success": true,
  "auditId": "audit-123",
  "message": "Audit started",
  "estimatedTime": "2 minutes"
}
```

---

### Get Audit Results

```
GET /translations/discover/results
```

**Description:** Get audit findings

**Query Parameters:**
- `auditId` (optional): Specific audit ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "keysInCode": 1245,
    "keysInJSON": 1247,
    "orphanedKeys": [
      "legacy.old_feature",
      "deprecated.button_text"
    ],
    "missingTranslations": {
      "ar": ["dashboard.new_metric"],
      "hi": ["payment.confirmation"]
    },
    "namingIssues": {
      "violations": 3,
      "examples": ["useLikeThis", "incorrectCasing"]
    }
  }
}
```

---

### Approve Discovered Keys

```
POST /translations/discover/approve
```

**Description:** Batch approve newly discovered keys

**Request Body:**
```json
{
  "keys": [
    "dashboard.new_metric",
    "settings.privacy_notice"
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "approved": 2,
  "message": "Keys approved and added to translation system"
}
```

---

### Schedule Audits

```
POST /translations/discover/schedule
```

**Description:** Set up periodic discovery audits

**Request Body:**
```json
{
  "enabled": true,
  "frequency": "weekly",
  "dayOfWeek": "Monday",
  "time": "02:00"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Audit schedule configured"
}
```

---

## Analytics

### Get User Language Analytics

```
GET /user-language-analytics
```

**Description:** Get language adoption statistics

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5432,
    "languagesInUse": ["en", "ar", "hi"],
    "mostUsedLanguage": "en",
    "distribution": [
      { "language": "English", "count": 2443, "percentage": "45%" },
      { "language": "Arabic", "count": 1901, "percentage": "35%" }
    ]
  }
}
```

---

### Get Adoption Trends

```
GET /user-language-analytics/trends
```

**Description:** Get language adoption over time

**Query Parameters:**
- `days` (optional): Period in days (default: 90)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      { "language": "en", "date": "2025-10-01", "users": 2400, "delta": 50 },
      { "language": "en", "date": "2025-10-02", "users": 2450, "delta": 50 }
    ]
  }
}
```

---

### Export Analytics

```
POST /user-language-analytics/export
```

**Description:** Export analytics data for BI tools

**Request Body:**
```json
{
  "format": "csv",
  "startDate": "2025-01-01",
  "endDate": "2025-10-23"
}
```

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics.csv"

date,language,users,sessions,engagement
2025-10-01,en,2400,3400,0.85
...
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": "Additional context if available"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async operation) |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 500 | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| LANGUAGE_NOT_FOUND | Language does not exist |
| LANGUAGE_EXISTS | Language already exists |
| INVALID_LOCALE | Invalid BCP 47 locale format |
| PERMISSION_DENIED | User lacks required permission |
| CROWDIN_AUTH_FAILED | Crowdin credentials invalid |
| API_RATE_LIMIT | Rate limit exceeded |
| DATABASE_ERROR | Database operation failed |

---

## Rate Limiting

- **Limit:** 100 requests per minute per API key
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` (optional, default: 10, max: 100)
- `skip` (optional, default: 0)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 1247,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

---

## Webhooks

Configure webhooks for Crowdin integration events:

```
POST /crowdin-integration/webhook
```

**Payload:**
```json
{
  "event": "translations_updated",
  "language": "ar",
  "keysUpdated": 45,
  "timestamp": "2025-10-23T10:30:00Z"
}
```

---

## Best Practices

1. **Cache GET responses** - Use browser/CDN cache for read-only endpoints
2. **Batch operations** - Use import/export for bulk changes instead of individual requests
3. **Async operations** - Operations like sync return `202 Accepted` with `syncId`
4. **Error handling** - Always check response status and error field
5. **Rate limiting** - Respect rate limit headers and implement backoff
6. **Permissions** - Always check required permissions in API documentation
