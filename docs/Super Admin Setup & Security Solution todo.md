
## ✅ Completed
- [x] Implemented /api/admin/audit-logs endpoint restricted to SUPER_ADMIN with filters and pagination.
  - **Why**: observability & compliance
  - **Impact**: enables secure access to audit records for platform owners

## 🔧 Next Steps
- [ ] Wire AdminAuditsPage to use /api/admin/audit-logs when SUPER_ADMIN; keep existing activity fallback for others.
- [ ] Add IP policy block auditing in middleware using logAudit with action: 'security.ip.block'.
- [ ] Add emergency scripts: scripts/admin-setup/reset-password.ts and disable-mfa.ts.
