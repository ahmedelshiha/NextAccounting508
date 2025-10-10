
## ✅ Completed
- [x] Prisma schema extended with SettingChangeDiff, FavoriteSetting, and AuditEvent
  - **Why**: Foundational data models for change previews, favorites, and richer auditing
  - **Impact**: Enables persisting diffs and user favorites with tenant scoping
- [x] API endpoints: /api/admin/settings/favorites (GET/POST/DELETE) and /api/admin/settings/diff/preview (POST)
  - **Why**: Provide UI-ready endpoints for favorites management and safe diff previews
  - **Impact**: Unblocks UI work for change tracking and favorites system

## 🚧 In Progress
- [ ] Prisma migrate and client generation in CI; add tests for new endpoints

## 🔧 Next Steps
- [ ] Wire favorites UI (pin/unpin) in SettingsOverview and category pages
- [ ] Persist diffs on save and emit AuditEvent entries
- [ ] RBAC refinements for settings features; rate limit diff preview
