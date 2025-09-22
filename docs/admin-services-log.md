## [2025-09-22] Services implementation plan and TODO reorganized
What I changed:
- Rewrote `docs/admin-services-todo.md` into a phased, dependency-ordered plan with explicit checkboxes and measurable tasks.
- Aligned tasks with the architecture audit in `docs/admin-services-audit.md` and clarified acceptance goals.

Why:
- Establish a clear critical path and enable autonomous, production-grade execution with traceable progress.

Next steps:
- Start Phase 1.1 (Type System Unification): remove local types in `@/app/admin/services/page.tsx`, import from `@/types/services.ts`, run typecheck, and fix issues.
