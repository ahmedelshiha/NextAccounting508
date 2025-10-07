
---
## ✅ Completed
- [x] Added `security.ratelimit.block` audit logging for admin newsletter list endpoint and auth password flows (forgot/reset) when rate limits trigger.
  - **Why**: improve visibility into abuse and throttling on privileged/admin-related surfaces
  - **Impact**: responders can trace 429s with IP and key context; no user-facing leakage

## 🚧 In Progress
- [ ] Continue auditing endpoints using applyRateLimit to ensure all privileged/admin routes emit `security.ratelimit.block` on 429; portal/public routes to be reviewed with privacy considerations.
