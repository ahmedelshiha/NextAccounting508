# Admin Settings Enhancements

## Completed
- [x] Resolve build failure in Communication Settings page
  - What: Added missing local state for Import modal (showImport, importData) and wired Export/Import controls.
  - Why: Enhancement/refactor of existing page to match established pattern used in other settings pages (clients, team, tasks), and to fix TS2304 errors.
  - Scope: src/app/admin/settings/communication/page.tsx
- [x] Audit Admin Settings pages and fix issues
  - What: Ensured consistent Export/Import controls and PermissionGate usage across settings pages; fixed missing PermissionGate import in booking settings page.
  - Scope: src/app/admin/settings/booking/page.tsx (added PermissionGate import), verified clients/team/tasks/analytics/financial/company pages.
- [x] Harden Communication Settings API endpoints
  - What: Standardized REST responses with `NextResponse`, enforced permission guards, and added inline documentation for maintainers across GET, PUT, export, and import handlers.
  - Why: Ensures manual verification can proceed with predictable responses, rate limiting, and error handling for the export/import JSON workflow.
  - Scope: src/app/api/admin/communication-settings/route.ts, src/app/api/admin/communication-settings/export/route.ts, src/app/api/admin/communication-settings/import/route.ts
- [x] Run full typecheck/build to baseline admin settings feature health
  - What: Executed `pnpm typecheck` (tsconfig.build.json) and resolved duplicate import errors in booking settings and communication settings API routes.
  - Why: Guarantees current code compiles before proceeding to manual verification and future enhancements.
  - Scope: src/app/admin/settings/booking/page.tsx, src/app/api/admin/communication-settings/export/route.ts, src/app/api/admin/communication-settings/import/route.ts

## Next Steps
- [ ] Execute navigation refactor to nest all system links under Admin → Settings

### Active TODOs
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
