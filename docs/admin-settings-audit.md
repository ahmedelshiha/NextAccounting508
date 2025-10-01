# Admin Settings Audit Report

Objective: audit the existing settings surface and determine locations of all elements that belong under the Admin "System" area. Identify duplicates and recommend canonical routes for migration into a unified /admin/settings panel.

Summary
- The codebase already contains a canonical settings registry at src/lib/settings/registry.ts and many individual settings pages under src/app/admin/settings/*.
- Some system pages still exist as top-level admin routes (e.g., /admin/users, /admin/security, /admin/integrations). These will need to be aliased or redirected into the unified settings surface to avoid duplication.

Inventory (current location -> file path)

- Settings (landing)
  - /admin/settings -> src/app/admin/settings/page.tsx
  - Settings navigation component: src/components/admin/SettingsNavigation.tsx
  - Registry: src/lib/settings/registry.ts

- Registry-registered settings (already present under /admin/settings)
  - Organization / Company
    - route: /admin/settings/company
    - file: src/app/admin/settings/company/page.tsx
  - Service Management
    - route: /admin/settings/services
    - (component registry entry present; ensure page exists or add)
  - Booking Configuration
    - route: /admin/settings/booking
    - file: src/app/admin/settings/booking/page.tsx
  - Client Management
    - route: /admin/settings/clients
    - file: src/app/admin/settings/clients/page.tsx
  - Task & Workflow
    - route: /admin/settings/tasks
    - file: src/app/admin/settings/tasks/page.tsx
  - Team Management
    - route: /admin/settings/team
    - file: src/app/admin/settings/team/page.tsx
  - Financial Settings
    - route: /admin/settings/financial
    - file: src/app/admin/settings/financial/page.tsx
  - Analytics & Reporting
    - route: /admin/settings/analytics
    - file: src/app/admin/settings/analytics/page.tsx
  - Communication
    - route: /admin/settings/communication
    - file: src/app/admin/settings/communication/page.tsx
  - Security & Compliance
    - route: /admin/settings/security
    - file: src/app/admin/settings/security/page.tsx
  - Integration Hub
    - route: /admin/settings/integrations
    - file: src/app/admin/settings/integrations/page.tsx
  - System Administration
    - route: /admin/settings/system
    - file: src/app/admin/settings/system/page.tsx
  - Other settings pages present:
    - /admin/settings/currencies -> src/app/admin/settings/currencies/page.tsx
    - /admin/settings/contact -> src/app/admin/settings/contact/page.tsx
    - /admin/settings/timezone -> src/app/admin/settings/timezone/page.tsx

- System pages outside /admin/settings (duplicates or related)
  - Users & Permissions (top-level)
    - /admin/users -> src/app/admin/users/page.tsx
    - /admin/roles -> src/app/admin/roles/page.tsx
    - /admin/permissions -> src/app/admin/permissions/page.tsx
  - Security (top-level)
    - /admin/security -> src/app/admin/security/page.tsx
    - Audits: /admin/audits -> src/app/admin/audits/page.tsx
    - Compliance: /admin/compliance -> src/app/admin/compliance/page.tsx
  - Integrations (top-level)
    - /admin/integrations -> src/app/admin/integrations/page.tsx
      - Note: there is also /admin/settings/integrations (duplicate surface)
  - Uploads
    - /admin/uploads/quarantine -> src/app/admin/uploads/quarantine/page.tsx (exists under admin/uploads)
  - Cron Telemetry
    - /admin/cron-telemetry -> src/app/admin/cron-telemetry/page.tsx

Duplicate detection & notes
- Integrations
  - Duplicate: /admin/integrations (top-level) and /admin/settings/integrations (registry). Decide canonical route (recommend /admin/settings/integrations) and add redirect from /admin/integrations -> /admin/settings/integrations.
- Security / Audits / Compliance
  - Registry contains securityCompliance route under /admin/settings/security, but functional pages still live at top-level (/admin/security, /admin/audits, /admin/compliance). Recommendation: surface these as nested tabs/pages under /admin/settings/security and add redirects from the top-level routes.
- Users & Permissions
  - Users, Roles and Permissions live at /admin/users, /admin/roles, /admin/permissions. Registry currently has teamManagement and clientManagement entries, but not the Users & Permissions item. Recommendation: add an explicit registry entry for Users & Permissions (key: users, label: 'Users & Permissions', route: '/admin/settings/users') that acts as a landing page linking to existing components (thin wrappers) or migrates them into nested routes under /admin/settings/users.
- Uploads
  - Quarantine exists at /admin/uploads/quarantine. Registry does not currently list uploads/quarantine specifically. Recommendation: add an `uploads` registry entry mapping to /admin/settings/uploads and migrate or alias quarantine route under it.
- Cron Telemetry
  - cron-telemetry exists at /admin/cron-telemetry. Recommendation: map it to /admin/settings/cron (or /admin/settings/telemetry) in the registry and add redirect.

Location map (Recommended canonical routes under /admin/settings)
- /admin/settings (landing)
- /admin/settings/company
- /admin/settings/booking
- /admin/settings/clients
- /admin/settings/tasks
- /admin/settings/team
- /admin/settings/financial
- /admin/settings/analytics
- /admin/settings/communication
- /admin/settings/security (tabs: security-center, audits, compliance)
- /admin/settings/users (tabs: users, roles, permissions)
- /admin/settings/integrations
- /admin/settings/uploads (tabs: quarantine)
- /admin/settings/cron (cron telemetry)

Actionable findings
1. SETTINGS_REGISTRY already covers many settings but is missing explicit entries for Users & Permissions, Uploads, and Cron Telemetry. Add these entries with correct permissions and icons.
2. Several top-level routes are duplicates and should be aliased/redirected to their /admin/settings equivalents to avoid fragmentation.
3. Migrate content into SettingsShell layout and ensure SettingsNavigation includes the new entries (use the registry's group/order metadata once normalized).
4. Preserve current pages by creating thin wrappers that import the existing implementations (avoid duplicating logic) and mount them under the new /admin/settings routes.
5. Add unit tests verifying: registry contains unique keys, no duplicate route paths across registry entries, each registry route corresponds to an existing page or wrapper.

Suggested next steps (short-term)
- Update registry: add entries for `users`, `uploads`, `cron` with appropriate permissions (PERMISSIONS.USERS_VIEW, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW or new perms), group and order values.
- Run a duplicate-route check script (small script) that scans SETTINGS_REGISTRY and top-level admin routes for path collisions; add it to CI.
- Implement redirects for top-level routes that will be consolidated (e.g., /admin/users -> /admin/settings/users).
- Start a POC migration of Booking (already present) to the SettingsShell to validate layout and navigation.

Files referenced during the audit
- src/lib/settings/registry.ts (registry source)
- src/components/admin/SettingsNavigation.tsx
- src/app/admin/settings/* (multiple pages listed above)
- src/components/admin/layout/AdminSidebar.tsx (sidebar references and system section)
- src/app/admin/users/page.tsx
- src/app/admin/security/page.tsx
- src/app/admin/integrations/page.tsx
- src/app/admin/uploads/quarantine/page.tsx
- src/app/admin/cron-telemetry/page.tsx

If you want, I can:
- Modify src/lib/settings/registry.ts to add `users`, `uploads`, and `cron` entries and include group/order metadata.
- Create thin redirect wrappers for /admin/users, /admin/security, /admin/integrations, /admin/uploads, /admin/cron-telemetry that redirect to the canonical /admin/settings routes.
- Add a CI check (script + test) that ensures SETTINGS_REGISTRY keys and routes are unique before merging.

Which of the follow-up tasks should I start with? (Suggested: update SETTINGS_REGISTRY with missing system items and run a duplicate-route check.)
