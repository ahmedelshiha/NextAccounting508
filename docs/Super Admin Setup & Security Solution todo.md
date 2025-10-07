
---
## ✅ Completed
- [x] Added `security.ratelimit.block` audit logging for portal and public endpoints on 429:
  - portal chat POST, portal service-requests (create, update, export, comments), public service-requests create, analytics track
  - **Why**: comprehensive visibility into abuse across user-facing surfaces
  - **Impact**: consistent incident traceability; minimal PII, tenant-scoped when available

## 🚧 In Progress
- [ ] Final sweep: verify all 429 paths for privileged and user-facing endpoints emit audits; document exclusions if any (e.g., extremely high-volume public endpoints if noise becomes an issue).
