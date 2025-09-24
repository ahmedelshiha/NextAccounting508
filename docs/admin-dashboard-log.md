## 2025-09-27 – Dashboard modularization: KPI Grid extraction
- Extracted ProfessionalKPIGrid into reusable component at src/components/dashboard/analytics/ProfessionalKPIGrid.tsx.
- Wired it into src/app/admin/page.tsx and passed only required stats props.
- Why: align with QuickBooks-style modular architecture; improve reuse and maintainability without changing visuals.
- Next: extract BusinessIntelligence and Activity components; align chart slots with spec; update docs accordingly.

## 2025-09-28 – Analytics chart wrappers and docs guidance
- Added RevenueTrendChart and BookingFunnelChart chart wrappers and composed them in BusinessIntelligence.
- Extracted IntelligentActivityFeed and moved BusinessIntelligence into src/components/dashboard/analytics for reuse.
- Created docs/dashboard-analytics-updates.md summarizing components, props, usage and next steps.
- Created docs/admin-dashboard-sync-instructions.md with exact text blocks to paste into dashboard-structure.md and quickbooks_dashboard_complete.md (ACL prevented direct edits).
- Why: keep documentation aligned and provide copy/paste ready changes in case ACL prevents direct file updates.
- Next: run lint/typecheck/tests and add unit tests for the two chart wrappers.
