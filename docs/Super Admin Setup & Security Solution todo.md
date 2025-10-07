
## ✅ Completed
- [x] Added unit tests for CIDR IP allowlist, step-up verification helper, and route enforcement (audit-logs, permissions roles).
  - Files: tests/security/ip-allowlist.test.ts, tests/security/step-up.test.ts, tests/admin-stepup.route.test.ts
  - **Impact**: guards now covered by automated tests; prevents regressions.
- [x] Added step-up prompts to Security Settings page and Permissions viewers for SUPER_ADMIN challenges.
  - Files: src/app/admin/settings/security/page.tsx, src/components/admin/permissions/RolePermissionsViewer.tsx, src/components/admin/permissions/UserPermissionsInspector.tsx
  - **Impact**: consistent UX to satisfy step-up without breaking flows.

## 🚧 In Progress
- [ ] None

## 🔧 Next Steps
- [ ] Extend route tests to cover /api/admin/security-settings PUT with step-up and negative flows.
- [ ] Document SUPERADMIN_STEPUP_MFA behavior in docs/ENVIRONMENT_VARIABLES_REFERENCE.md and ops runbook.
