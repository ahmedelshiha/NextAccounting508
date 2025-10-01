## High Priority: Admin Settings Navigation Refactor
- [ ] Execute navigation refactor to nest all system links under Admin → Settings

### Active TODOs (High Priority)
- [ ] Audit AdminSidebar system section and settings registry for current structure and dependencies.
- [ ] Design consolidated Settings submenu structure including relocated links and required permissions/icons.
- [ ] Update AdminSidebar navigation data to reflect new Settings hierarchy.
- [ ] Align SETTINGS_REGISTRY (or equivalent source) with new submenu entries.
- [ ] Refactor related permission checks, analytics, and tests impacted by navigation changes.
- [ ] Run `pnpm typecheck` and relevant sidebar/navigation test suites.
- [ ] Manually verify Settings submenu behavior in admin UI.
- [ ] Document outcomes and follow-ups in docs/admin-settings-enhancement-todo.md.

### Navigation Refactor Plan
- [ ] Audit AdminSidebar system section and corresponding settings registry entries to capture current routes, permissions, and icon usage.
- [ ] Design consolidated Settings submenu structure that includes Users & Permissions, Security, Uploads, Cron Telemetry, and Integrations while preserving permissions and badges.
- [ ] Update AdminSidebar navigation data so the System section exposes only the Settings parent with the five relocated submenu links.
- [ ] Align SETTINGS_REGISTRY (or equivalent source) with the new submenu entries to avoid duplicate hard-coding.
- [ ] Refactor related permission gates, analytics tracking, and automated tests impacted by the hierarchy shift.
- [ ] Run `pnpm typecheck` and any sidebar/navigation test suites to confirm the refactor is production-ready.
- [ ] Manually verify in the admin UI that the Settings submenu renders the new links, expands/collapses correctly, and respects permissions.
- [ ] Document the completed work and any follow-up actions in this file once the refactor ships.

### Manual Verification Checklist
- Navigate to Admin → Settings → Communication
- Click Export and confirm a JSON download is triggered
- Click Import and upload a valid JSON; confirm Import button enables and sends POST to /api/admin/communication-settings/import
- After import, confirm settings reload and modal closes
- Validate permissions: Import/Export buttons are hidden without appropriate permissions
