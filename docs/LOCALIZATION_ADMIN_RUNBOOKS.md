# Localization Admin Settings - Runbooks & How-To Guides

**Last Updated:** 2025-10-23  
**Version:** 1.0  

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Languages Management](#languages-management)
3. [Organization Settings](#organization-settings)
4. [Regional Formats](#regional-formats)
5. [Crowdin Integration](#crowdin-integration)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Common Tasks](#common-tasks)

---

## Getting Started

### Accessing Localization Settings

1. Navigate to Admin Panel → Settings
2. Click "Localization & Languages" in the settings menu
3. You should see the Localization dashboard with 8 tabs

### Required Permissions

You need one of these permissions:
- `LANGUAGES_VIEW` - View localization settings (read-only)
- `LANGUAGES_MANAGE` - Manage languages and settings (full access)

If you don't have access, contact your system administrator.

---

## Languages Management

### Add a New Language

1. Click the **Languages & Availability** tab
2. Click **[Add Language]** button
3. Fill in the form:
   - **Language Code** (required): ISO 639-1 code (e.g., `de` for German)
   - **Language Name**: Display name (e.g., "German")
   - **Native Name**: Name in native language (e.g., "Deutsch")
   - **BCP 47 Locale**: Full locale identifier (e.g., `de-DE`)
   - **Direction**: LTR or RTL (e.g., RTL for Arabic)
4. Click **[Add Language]**
5. You'll see a success notification

**Tip:** Use flag emojis for the Flag field to make the interface more visual.

### Edit Language Settings

1. Go to **Languages & Availability** tab
2. Find the language in the table
3. Click the language row to edit:
   - Toggle enabled/disabled status
   - Mark as "Featured" to show in language switcher
   - Change language properties
4. Click **[Save]**

### Delete a Language

1. Go to **Languages & Availability** tab
2. Find the language in the table
3. Click **[Delete]** button next to the language
4. Confirm the deletion

**Warning:** Deleting a language removes all associated translations!

### Bulk Import Languages

1. Go to **Languages & Availability** tab
2. Click **[Import]** button
3. Choose a JSON file with language definitions
4. Review the import preview
5. Click **[Confirm Import]**

**Import File Format (JSON):**
```json
[
  {
    "code": "de",
    "name": "German",
    "nativeName": "Deutsch",
    "direction": "ltr",
    "bcp47Locale": "de-DE",
    "enabled": true,
    "featured": true,
    "flag": "🇩🇪"
  }
]
```

### Bulk Export Languages

1. Go to **Languages & Availability** tab
2. Click **[Export]** button
3. A JSON file downloads with all language definitions
4. Use this for backups or to import into another system

---

## Organization Settings

### Set Default Language

1. Click **Organization Settings** tab
2. Find "Default Language" dropdown
3. Select the language new users will see by default
4. Click **[Save]**

**Example:** If most users are English speakers, set English as default.

### Configure Language Switcher

1. Click **Organization Settings** tab
2. Toggle **"Show language switcher to clients"**:
   - **On**: Users can switch languages
   - **Off**: Users see only the default language
3. Click **[Save]**

### Enable Browser Language Detection

1. Click **Organization Settings** tab
2. Toggle **"Auto-detect browser language"**:
   - **On**: System detects user's browser language and shows that language
   - **Off**: Always use default language
3. Click **[Save]**

**Use Case:** If your users are globally distributed, enabling auto-detect improves UX.

### Configure Missing Translation Behavior

1. Click **Organization Settings** tab
2. Select how to handle missing translations:
   - **Show Key**: Display the translation key (e.g., "hero.welcome_title")
   - **Show Fallback**: Display English (or default) translation
   - **Show Empty**: Leave blank
3. Click **[Save]**

**Recommendation:** Use "Show Fallback" for production, "Show Key" for development.

### Preview Organization Settings

1. Click **Organization Settings** tab
2. Click **[Preview Settings]**
3. You'll see how the site would look with these settings
4. Close preview when done

---

## Regional Formats

### Configure Date & Time Format

1. Click **Regional Formats** tab
2. Select a language from the list
3. Update format fields:
   - **Date Format**: e.g., `DD/MM/YYYY` or `MM/DD/YYYY`
   - **Time Format**: e.g., `14:30` or `2:30 PM`
4. See the preview update in real-time
5. Click **[Save]**

### Configure Currency Settings

1. Click **Regional Formats** tab
2. Select a language
3. Update:
   - **Currency Code**: e.g., `USD`, `EUR`, `GBP`
   - **Currency Symbol**: e.g., `$`, `€`, `£`
4. Click **[Save]**

### Configure Number Format

1. Click **Regional Formats** tab
2. Select a language
3. Update:
   - **Decimal Separator**: `.` or `,`
   - **Thousands Separator**: `,` or `.`
4. Example preview: `1,234.56` (US) vs `1.234,56` (Germany)
5. Click **[Save]**

### Import Format Templates

1. Click **Regional Formats** tab
2. Click **[Import CLDR]**
3. Select a language to auto-populate from Unicode CLDR
4. Review the suggestions
5. Click **[Confirm]** to apply

---

## Crowdin Integration

### Connect to Crowdin

1. Click **Translation Platforms** tab
2. Enter your Crowdin project details:
   - **Project ID**: From your Crowdin project settings
   - **API Token**: Personal API token from Crowdin
3. Click **[Test Connection]**
4. If successful, you'll see a green checkmark
5. Click **[Save]**

**Where to find Crowdin credentials:**
- Project ID: Settings → Project Info
- API Token: Personal profile → Integrations → API

### Set Up Auto-Sync

1. Click **Translation Platforms** tab
2. Choose sync schedule:
   - **Manual Only**: Sync only when you click button
   - **Daily Auto-Sync**: Every day at specified time
   - **Weekly Auto-Sync**: Every week at specified time
   - **Real-time (Webhook)**: Syncs when Crowdin updates
3. Click **[Save]**

**Recommendation:** Start with Daily for safety, upgrade to Weekly as trust grows.

### Trigger Manual Sync

1. Click **Translation Platforms** tab
2. Click **[Sync Now]**
3. Watch the sync progress in the dashboard
4. Check **Last Sync** status when complete
5. If errors occur, review the sync log

### View Crowdin Project Health

1. Click **Translation Platforms** tab
2. See "Project Health" section showing:
   - **Language Coverage %**: How complete each language is
   - **Last Sync Time**: When translations were last updated
   - **Sync Status**: Success, pending, or failed

### Set Up Review PRs

1. Click **Translation Platforms** tab
2. Toggle **"Create PR for new translations"**
3. Toggle **"Auto-merge translations"** (optional)
4. Click **[Save]**

This will create pull requests for new translations automatically.

---

## Analytics & Monitoring

### View Language Adoption

1. Click **User Language Control** tab
2. See summary cards:
   - **Total Users**: How many users are using the system
   - **Languages in Use**: How many languages are active
   - **Most Used**: Which language has most users
3. View the distribution chart to see user percentages

### Track Adoption Trends

1. Click **Analytics** tab
2. View "Adoption Trend (Last 90 Days)"
3. Analyze which languages are growing/declining
4. Use this to decide which languages to prioritize

### Monitor Translation Coverage

1. Click **Translation Dashboard** tab
2. See coverage % for each language:
   - **Green (90-100%)**: Well translated
   - **Yellow (70-89%)**: Missing some translations
   - **Red (<70%)**: Many missing translations
3. Click **[View All Missing]** to see specific keys

### Export Analytics Data

1. Click **Analytics** tab
2. Click **[Export Data]**
3. Choose format: CSV or JSON
4. Use for reports or BI tools

---

## Common Tasks

### Switch Default Language

**Scenario:** Your primary market changed from English to Spanish.

1. Go to **Organization Settings** tab
2. Change "Default Language" to Spanish
3. Click **[Save]**

### Add New Language Quickly

**Scenario:** You need to support Portuguese immediately.

1. Go to **Languages & Availability** tab
2. Click **[Add Language]**
3. Fill in:
   - Code: `pt`
   - Name: `Portuguese`
   - Native Name: `Português`
   - Locale: `pt-BR`
4. Click **[Add Language]**
5. Go to **Regional Formats** tab
6. Set up PT-specific date/number formats
7. Go to **Translation Platforms** → Add to Crowdin project

### Enable RTL Support

**Scenario:** You're adding Arabic or Hebrew support.

1. Go to **Languages & Availability** tab
2. Add language with Direction: RTL
3. Go to **Organization Settings** tab
4. Ensure **"Auto-apply RTL for RTL languages"** is enabled
5. Test the UI in the new language

### Backup All Translations

**Scenario:** You want to backup before a major update.

1. Go to **Languages & Availability** tab
2. Click **[Export]**
3. Save the languages JSON file
4. Go to **Translation Dashboard** tab
5. Click **[Generate Report]** and export as CSV
6. Store these files in your backup system

### Investigate Missing Translations

**Scenario:** Users report seeing translation keys instead of text.

1. Go to **Translation Dashboard** tab
2. Look for red language in the coverage section
3. Click **[View All Missing]** to see which keys are missing
4. In **Organization Settings**, change "Missing Translation Behavior" to "Show Fallback"
5. Go to **Key Discovery** tab and run audit to find all untranslated keys
6. Prioritize and send to translators

---

## Troubleshooting

### Issue: Changes Not Saving

**Symptoms:** Click save but nothing happens

**Solution:**
1. Check your permissions (need `LANGUAGES_MANAGE`)
2. Try saving a single field
3. Check browser console for errors (F12)
4. Try a different browser
5. Clear browser cache and reload

### Issue: Import Fails

**Symptoms:** "Failed to import languages" error

**Solution:**
1. Verify JSON file format is correct
2. Check language codes are valid (ISO 639-1)
3. Ensure file is not corrupted
4. Try importing a smaller subset first
5. Check for duplicate language codes

### Issue: Crowdin Sync Not Working

**Symptoms:** "Failed to connect to Crowdin" error

**Solution:**
1. Verify Crowdin credentials (Project ID, API token)
2. Check Project ID in Crowdin settings
3. Verify API token hasn't expired
4. Test connection again
5. Check Crowdin API status page
6. Ensure firewall allows Crowdin API access

### Issue: Charts Not Loading

**Symptoms:** Analytics tab shows "Insufficient data"

**Solution:**
1. Wait for more users to use the system
2. Check if analytics are being tracked
3. Verify user language preferences are recorded
4. Try refreshing the page
5. Check browser console for errors

### Issue: Performance is Slow

**Symptoms:** Page takes >2 seconds to load

**Solution:**
1. Check network tab for slow API calls
2. Reduce number of languages to those in use
3. Archive unused languages
4. Clear browser cache
5. Check server resources/load

---

## Support & Escalation

### Getting Help

- **Documentation**: Check docs/LOCALIZATION_ADMIN_SETTINGS_SUMMARY.md
- **Email**: localization-team@company.com
- **Slack**: #localization-support
- **Tickets**: Create issue in project management system

### When to Escalate

Escalate to engineering if:
- API errors that can't be fixed by configuration
- Performance issues affecting production
- Data integrity concerns
- New feature requests

### Gathering Debug Info

When reporting issues, include:
1. What you were trying to do
2. What error you saw
3. Screenshot of the error
4. Browser type and version
5. Steps to reproduce

---

## Quick Reference

### Keyboard Shortcuts

Coming soon! We're working on keyboard shortcuts for power users.

### Settings Quick Links

- Languages: `/admin/settings/localization?tab=languages`
- Organization: `/admin/settings/localization?tab=organization`
- User Preferences: `/admin/settings/localization?tab=user-preferences`
- Regional Formats: `/admin/settings/localization?tab=regional`
- Integration: `/admin/settings/localization?tab=integration`
- Translations: `/admin/settings/localization?tab=translations`
- Analytics: `/admin/settings/localization?tab=analytics`
- Discovery: `/admin/settings/localization?tab=discovery`

---

## Appendix

### ISO 639-1 Language Codes (Common)

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| fr | French |
| de | German |
| it | Italian |
| pt | Portuguese |
| ru | Russian |
| ar | Arabic |
| hi | Hindi |
| ja | Japanese |
| zh | Chinese |
| ko | Korean |

### BCP 47 Locale Examples

| Locale | Usage |
|--------|-------|
| en-US | English (United States) |
| en-GB | English (United Kingdom) |
| es-ES | Spanish (Spain) |
| es-MX | Spanish (Mexico) |
| pt-BR | Portuguese (Brazil) |
| pt-PT | Portuguese (Portugal) |
| ar-SA | Arabic (Saudi Arabia) |
| ar-AE | Arabic (United Arab Emirates) |
| zh-CN | Chinese (Simplified, China) |
| zh-TW | Chinese (Traditional, Taiwan) |

### Common Date Formats

| Format | Example | Region |
|--------|---------|--------|
| DD/MM/YYYY | 25/12/2024 | Europe, Australia |
| MM/DD/YYYY | 12/25/2024 | United States |
| YYYY-MM-DD | 2024-12-25 | ISO Standard |

### Currency Symbols

| Code | Symbol | Countries |
|------|--------|-----------|
| USD | $ | USA |
| EUR | € | Eurozone |
| GBP | £ | UK |
| JPY | ¥ | Japan |
| CHF | Fr | Switzerland |
| AUD | A$ | Australia |
