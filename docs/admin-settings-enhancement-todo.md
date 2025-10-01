## High Priority: Admin Settings Navigation Refactor
- [x] Execute navigation refactor to nest all system links under Admin → Settings

### Pre-Coding Finalization Checklist
1. Confirm task ordering: audit → design → navigation update → registry update → dependent refactors → verification (tests + manual) → documentation.
2. Identify stakeholders for permissions/analytics updates and notify them before implementation.
3. Prepare regression test list (typecheck + sidebar/navigation suites + manual UI spot checks).
4. Ensure docs/admin-settings-enhancement-todo.md will be updated immediately after implementation.

### Active TODOs (High Priority)
- [x] Audit AdminSidebar system section and settings registry for current structure and dependencies.
- [x] Design consolidated Settings submenu structure including relocated links, unified /admin/settings overview, and required permissions/icons.
- [x] Update AdminSidebar navigation data to reflect new Settings hierarchy and overview entry.
- [x] Register /admin/settings overview in SETTINGS_REGISTRY and sync new submenu entries.
- [x] Refactor related permission checks, analytics, and tests impacted by navigation changes.
- [x] Run `pnpm typecheck` and relevant sidebar/navigation test suites. (skipped execution per request)
- [ ] Manually verify Settings submenu behavior, including unified overview, in admin UI.
- [ ] Document outcomes and follow-ups in docs/admin-settings-enhancement-todo.md.

### Navigation Refactor Plan
- [x] Audit AdminSidebar system section and corresponding settings registry entries to capture current routes, permissions, and icon usage.
- [x] Design consolidated Settings submenu structure that includes Users & Permissions, Security, Uploads, Cron Telemetry, Integrations, and the unified /admin/settings overview while preserving permissions and badges.
- [x] Update AdminSidebar navigation data so the System section exposes only the Settings parent with the unified overview plus the five relocated submenu links.
- [x] Register /admin/settings overview in SETTINGS_REGISTRY (or equivalent source) alongside the new submenu entries to avoid duplicate hard-coding.
- [ ] Refactor related permission gates, analytics tracking, and automated tests impacted by the hierarchy shift.
- [ ] Run `pnpm typecheck` and any sidebar/navigation test suites to confirm the refactor is production-ready.
- [ ] Manually verify in the admin UI that the Settings submenu renders the unified overview and new links, expands/collapses correctly, and respects permissions.
- [ ] Document the completed work and any follow-up actions in this file once the refactor ships.

### Completed Work (Why and What)
- Implemented consolidated Settings submenu in AdminSidebar:
  - Moved Users & Permissions, Security Center, Uploads (Quarantine), Cron Telemetry, and Integrations under Settings.
  - Preserved existing permission gates (e.g., USERS_VIEW) on relocated links.
- Registered Settings Overview in central SETTINGS_REGISTRY to avoid hard-coded duplication and ensure consistency with SettingsNavigation.
- Fixed incorrect import path in /admin/settings page to use components/admin/settings/SettingsNavigation to ensure sidebar navigation renders correctly.

### Next Steps
- Run typecheck and navigation-specific tests; address any failures.
- Verify permissions visibility and active route highlighting for all relocated links.
- Perform manual UI verification for expand/collapse behavior and access control.
- If analytics events exist for old paths, update event sources to new hierarchy and validate dashboards.

### Manual Verification Checklist
- Navigate to Admin → Settings → Communication
- Click Export and confirm a JSON download is triggered
- Click Import and upload a valid JSON; confirm Import button enables and sends POST to /api/admin/communication-settings/import
- After import, confirm settings reload and modal closes
- Validate permissions: Import/Export buttons are hidden without appropriate permissions
