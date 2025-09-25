### TypeScript and e2e files

Playwright test files live in the `e2e/` folder. These files import `@playwright/test` and are not required during a Next.js production build. To avoid TypeScript compile errors during deployment, `e2e/` is excluded from TypeScript compilation in `tsconfig.json` and `tsconfig.build.json`.

If you want CI to run E2E tests, ensure `@playwright/test` is installed in CI and run `pnpm test:e2e` in a job that installs devDependencies and sets up browsers.
