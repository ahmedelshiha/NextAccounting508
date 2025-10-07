Super Admin & Audit Logging schema updates:
- Added `SUPER_ADMIN` to the `UserRole` enum for elevated platform access.
- Introduced `AuditLog` model mapped to `audit_logs` with tenant/user relations, metadata fields, and indexes for security analytics.
- Linked `AuditLog` relations from `User` and `Tenant` models.
- Regenerate Prisma client after deploying migration to propagate enum/type changes.
