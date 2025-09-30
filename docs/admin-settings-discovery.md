# Admin Settings — Discovery Inventory

Date: ${new Date().toISOString()}

## Files and Routes (settings-related)

- Admin Settings pages (routes):
  - src/app/admin/settings/page.tsx (hub)
  - src/app/admin/settings/booking/page.tsx
  - src/app/admin/settings/company/page.tsx
  - src/app/admin/settings/contact/page.tsx
  - src/app/admin/settings/currencies/page.tsx
  - src/app/admin/settings/financial/page.tsx
  - src/app/admin/settings/timezone/page.tsx

- Settings components:
  - src/components/admin/settings/SettingsNavigation.tsx
  - src/components/admin/settings/SettingsShell.tsx
  - src/components/admin/settings/FormField.tsx
  - src/components/admin/settings/Tabs.tsx
  - Organization tabs:
    - src/components/admin/settings/groups/Organization/GeneralTab.tsx
    - src/components/admin/settings/groups/Organization/ContactTab.tsx
    - src/components/admin/settings/groups/Organization/LocalizationTab.tsx
    - src/components/admin/settings/groups/Organization/BrandingTab.tsx
    - src/components/admin/settings/groups/Organization/LegalTab.tsx

- Registry & types:
  - src/lib/settings/types.ts
  - src/lib/settings/registry.ts

- APIs (existing):
  - Organization: src/app/api/admin/org-settings/route.ts
  - Booking Settings (multiple):
    - src/app/api/admin/booking-settings/route.ts
    - src/app/api/admin/booking-settings/validate/route.ts
    - src/app/api/admin/booking-settings/export/route.ts
    - src/app/api/admin/booking-settings/import/route.ts
    - src/app/api/admin/booking-settings/reset/route.ts
    - src/app/api/admin/booking-settings/business-hours/route.ts
    - src/app/api/admin/booking-settings/payment-methods/route.ts
    - src/app/api/admin/booking-settings/steps/route.ts
    - src/app/api/admin/booking-settings/automation/route.ts
    - src/app/api/admin/booking-settings/integrations/route.ts
    - src/app/api/admin/booking-settings/capacity/route.ts
    - src/app/api/admin/booking-settings/forms/route.ts

- Services:
  - src/services/booking-settings.service.ts

- Schemas:
  - src/schemas/settings/organization.ts
  - src/schemas/booking-settings.schemas.ts (includes automation, integrations, capacity, forms payloads)

## RBAC Source of Truth

- File: src/lib/permissions.ts
- Present keys include booking settings, services, analytics, team, users, etc.

### Missing permission keys for new settings categories
Add these to PERMISSIONS and ROLE_PERMISSIONS as appropriate:

- Organization Settings: ORG_SETTINGS_VIEW, ORG_SETTINGS_EDIT, ORG_SETTINGS_EXPORT (optional)
- Financial Settings: FIN_SETTINGS_VIEW, FIN_SETTINGS_EDIT, FIN_SETTINGS_EXPORT
- Integration Hub: INTEGRATIONS_SETTINGS_VIEW, INTEGRATIONS_SETTINGS_EDIT, INTEGRATIONS_SETTINGS_TEST
- Security & Compliance: SEC_SETTINGS_VIEW, SEC_SETTINGS_EDIT
- Communication: COMMS_SETTINGS_VIEW, COMMS_SETTINGS_EDIT, COMMS_SETTINGS_TEST
- Analytics & Reporting: AR_SETTINGS_VIEW, AR_SETTINGS_EDIT, AR_SETTINGS_EXPORT
- Client Management: CLIENT_SETTINGS_VIEW, CLIENT_SETTINGS_EDIT
- Team Management: TEAM_SETTINGS_VIEW, TEAM_SETTINGS_EDIT
- Task & Workflow: TASK_SETTINGS_VIEW, TASK_SETTINGS_EDIT
- System Administration: SYS_SETTINGS_VIEW, SYS_SETTINGS_EDIT

For categories supporting import/export/reset, also define: *_IMPORT, *_EXPORT, *_RESET where applicable.

## Notes
- SettingsNavigation is already wired and should source from the registry.
- BookingSettingsPanel exists; extend with new tabs and sub-endpoints per plan.
- Organization settings API is present and functional; ensure Prisma migrations exist in deployment pipelines.
