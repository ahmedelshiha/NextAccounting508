# Service Portal TODO

Updated: 2025-09-21 (latest edits)

What was completed ✅
- Wired Admin Services page to reusable components (ServicesHeader, ServicesFilters, ServiceCard, ServiceForm, BulkActionsPanel, ServicesAnalytics).
- Implemented accessible modal dialog (src/components/ui/Modal.tsx) and migrated ServiceForm to modal-based create/edit flows.
- Integrated focus-trap-react for robust focus management and outside-click/Escape handling.
- Added unit tests for services utilities and Zod schemas (tests/services/utils.test.ts, tests/services/schemas.test.ts).
- Reorganized admin-services TODOs into an ordered, dependency-aware checklist and updated docs (docs/admin-services-todo.md, docs/admin-services-log.md).

Why it was done
- Improve admin UX and maintainability by reusing modular components and centralizing logic.
- Ensure accessibility for modal interactions (keyboard, focus management, screen readers) using a proven focus-trap implementation.
- Increase reliability via unit tests and clearer, actionable TODOs to accelerate follow-up work and reviews.

Next steps (short-term)
- Run dependency install and CI locally: pnpm install, pnpm run lint, pnpm exec vitest run. Fix any lint/type/test failures reported locally.
- Add component tests for modal behavior and services page interactions (open/close, focus-trap, create/edit flow).
- Implement integration tests for admin services APIs (list/create/update/delete/bulk/export).
- Finalize Netlify deployment checklist and perform a preview deploy.

Owner / How to validate
- Developer: run the commands above, visit /admin/services to validate: header, filters, analytics, card grid, modal create/edit, bulk actions.
- Accessibility: open modal, verify focus stays within, Escape closes, and focus returns to trigger.

Notes
- I added focus-trap-react to package.json — run pnpm install locally before running tests or the dev server.
- Some CI/typecheck steps could not be executed in this environment due to policy restrictions; run them locally and paste any errors for further fixes.
