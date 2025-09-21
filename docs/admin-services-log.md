## [2025-09-21] Added admin services API integration tests and page component tests
What I implemented:
- Created tests/admin-services.route.test.ts covering services list, create, update, delete, bulk actions, export, and stats endpoints with an in-memory Prisma mock.
- Created tests/services/page.component.test.ts to assert Services page header and primary actions render consistently.

Why:
- Provide baseline coverage for admin services flows and ensure API contracts and UI affordances are verified.

Next steps:
- Add CI to run lint, typecheck, and tests; configure Netlify preview deploy and smoke tests.
