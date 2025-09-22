## [2025-09-22] Phase 1.1 – Type System Unification completed
What I changed:
- Refactored `@/app/admin/services/page.tsx` to remove local `Service`, `ServiceStats`, `ServiceFilters`, and `ServiceAnalytics` interfaces.
- Imported shared types from `@/types/services` and split sorting state into `sortBy`/`sortOrder` separate from `ServiceFilters`.
- Updated query parameter construction and UI controls to use the new sort state.

Why:
- Eliminate type duplication and drift; enforce a single source of truth for service-related types; improve maintainability and type safety.

Next steps:
- Phase 1.2 – replace inline header/filters/analytics with shared components and verify UX parity.
- Run `pnpm run typecheck` locally and address any residual type issues if present.
