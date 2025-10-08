
## 🚧 In Progress (High Priority)
- [ ] Remote DB connection and migration application — Priority: High
  - Owner: Ops/Backend
  - Status: Executing and monitoring rollout across environments
  - Notes: Neon connection configured via NETLIFY_DATABASE_URL/DATABASE_URL; continue validation and access monitoring
- [ ] Apply schema migration and seed to add `superAdmin` to `security_settings` — Priority: High
  - Owner: Ops/Backend
  - Status: Rolling out and validating; ensure defaults persist and APIs reflect tenant-level overrides
  - Verification: `security_settings.superAdmin` JSON contains `stepUpMfa`, `logAdminAccess`; seed idempotent across runs
