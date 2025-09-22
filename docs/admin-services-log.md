

## [2025-09-25] Reorganization & actionable todo breakdown
What I changed:
- Reorganized docs/admin-services-todo.md into dependency-ordered, granular tasks with explicit acceptance criteria and measurable outputs.
- Marked already-implemented items as completed and created a concise set of immediate next steps (migrations, CI, Redis, tests, UI verification).

Why:
- Large tasks and phases were ambiguous and prevented incremental progress; breaking them down reduces review friction and enables parallel workstreams.

Next steps:
- Implement CI workflow and create Prisma migration for ServiceView + service.views (migration file added to git and must be run with DB credentials).
- Add unit/integration tests for analytics and bulk operations.
- Plan Redis adoption and schedule Netlify staging validation for migrations.

