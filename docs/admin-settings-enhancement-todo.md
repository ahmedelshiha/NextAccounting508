# Admin Settings Enhancements

## Completed
- [x] Resolve build failure in Communication Settings page
  - What: Added missing local state for Import modal (showImport, importData) and wired Export/Import controls.
  - Why: Enhancement/refactor of existing page to match established pattern used in other settings pages (clients, team, tasks), and to fix TS2304 errors.
  - Scope: src/app/admin/settings/communication/page.tsx
- [x] Audit Admin Settings pages and fix issues
  - What: Ensured consistent Export/Import controls and PermissionGate usage across settings pages; fixed missing PermissionGate import in booking settings page.
  - Scope: src/app/admin/settings/booking/page.tsx (added PermissionGate import), verified clients/team/tasks/analytics/financial/company pages.

## Next Steps
- [ ] Run full typecheck/build and address any additional TypeScript errors.
- [x] Add smoke tests for Import modal open/close and JSON parsing success/failure paths. (Already present: tests/components/communication-settings.export-import.ui.test.tsx)
- [x] Add Playwright E2E spec for Export/Import flow (e2e/tests/admin-communication-settings.spec.ts)
- [ ] Manually verify /api/admin/communication-settings/export and /import endpoints end-to-end from the UI.

### Manual Verification Checklist
- Navigate to Admin → Settings → Communication
- Click Export and confirm a JSON download is triggered
- Click Import and upload a valid JSON; confirm Import button enables and sends POST to /api/admin/communication-settings/import
- After import, confirm settings reload and modal closes
- Validate permissions: Import/Export buttons are hidden without appropriate permissions
