## ✅ Completed
- [x] Post-login redirect fallback now routes to /admin when /api/users/me fails.
  - **Why**: Avoids misrouting SUPER_ADMIN to portal when session fetch is temporarily unavailable.
  - **Impact**: SUPER_ADMIN lands on admin dashboard; middleware will re-route non-admin users to portal if needed.
