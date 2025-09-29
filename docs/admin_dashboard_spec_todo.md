[the file was previously long; appending update]

## Hotfix – 2025-09-30 (Admin footer optimization)
- [x] Compact admin footer and remove unimplemented links
  - Why: The admin footer previously exposed many secondary links (Logs, Documentation, API Reference, Support Tickets) that did not have corresponding routes or were not yet implemented, increasing cognitive load and maintenance. The footer was also visually large and duplicated system details.
  - Type: Enhancement / cleanup
  - Files changed: src/components/admin/layout/AdminFooter.tsx
  - What changed:
    - Replaced verbose multi-column layout with a compact single-row footer.
    - Kept essential links only: Analytics, Settings, Main Site.
    - Reduced visual weight: smaller font-size, compact icons, minimal status indicator.
    - Removed links to unimplemented pages (/admin/logs, /admin/docs, /admin/api-docs, /admin/support) to avoid broken navigation.
  - Next steps: If those features are implemented later, re-introduce them conservatively and ensure tests cover the routes.

