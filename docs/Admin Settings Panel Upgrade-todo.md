
## ✅ Completed
- [x] Backfilled tenantId for existing ComplianceRecord, HealthLog, and Task rows via SQL migration; added FKs to Tenant(id)
  - **Why**: Unblock schema requirements without data loss
  - **Impact**: Tenant scoping enforced on legacy rows; future writes conform to multi-tenant model

## ⚠️ Issues / Risks
- Detected wider drift (enum recreation, extra table `playing_with_neon`, uniqueness changes). Skipped destructive `db push` to avoid data loss. Plan dedicated migration in staging later.
