# Engineering Styleguide

## Languages & Tooling
- TypeScript strict; no `any` without justification.
- ESLint + Prettier as configured in repo.
- Path aliases: `@` → `src` (see vitest.config.ts and tsconfig.json).

## React & Next.js
- Prefer Server Components where possible; use Client Components only when needed.
- Co-locate feature UI, hooks, and tests within feature directories.
- Keep components small, with descriptive class names; avoid inline styles—use Tailwind classes.
- Preserve existing CSS variables and theme tokens exactly as defined.

## State & Data
- Use React state locally; Zustand for complex client state where present.
- Fetch via route handlers or server utilities in `src/lib`; validate input/output with Zod.

## API Design
- Handlers in `src/app/api/**/route.ts`.
- Consistent response helpers in `src/lib/api-response.ts` and error shapes in `src/lib/api-error.ts`.
- Version endpoints only when necessary; prefer stability via validators and tests.

## Naming & Structure
- Folders: `admin`, `portal`, `booking`, `services`, `tasks`, etc.
- Tests mirror source structure.
- Use descriptive file names; avoid ambiguous duplicates.

## Commits & PRs
- Conventional-style messages (e.g., `feat(tasks): ...`).
- Include tests and docs updates when behavior changes.

## Performance & Accessibility
- Respect performance budgets (LCP/CLS tests).
- Use semantic HTML and ARIA as needed; ensure keyboard navigability.
