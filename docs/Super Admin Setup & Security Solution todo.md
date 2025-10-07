
## ✅ Completed
- [x] Wired AdminAuditsPage to use /api/admin/audit-logs for SUPER_ADMIN; legacy activity endpoint remains for others.
  - **Why**: correct data source based on privileges
  - **Impact**: SUPER_ADMINs see full audit logs; others see activity view
- [x] Added IP policy block audit in middleware (action: security.ip.block) with graceful edge fallback.
  - **Why**: traceability of access denials
  - **Impact**: improved incident visibility
- [x] Shipped emergency scripts: scripts/admin-setup/reset-password.ts and scripts/admin-setup/disable-mfa.ts
  - **Why**: recovery procedures
  - **Impact**: rapid response for lockouts and MFA issues
