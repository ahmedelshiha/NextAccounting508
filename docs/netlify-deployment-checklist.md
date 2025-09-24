Netlify Deployment Checklist for accounting-firm

Build & Runtime

- Node engine: >=18 (package.json specifies node >=18)
- Package manager: pnpm (packageManager in package.json)
- Build command: pnpm db:generate && pnpm build
  - This ensures Prisma client is generated before Next.js build
- Publish directory: .next (default for Next.js App Router)

Environment variables (required)

- NEXT_PUBLIC_BASE_URL - public site URL
- DATABASE_URL - Postgres connection string (for prisma)
- NEXTAUTH_URL - URL for next-auth callbacks
- SENTRY_DSN - (optional) Sentry DSN
- SENDGRID_API_KEY - (optional) for email sending

Netlify settings

- Set Build command to: pnpm db:generate && pnpm build
- Set the Node version to 18 via environment variable or .nvmrc
- Add environment variables in Netlify UI or via Netlify CLI
- In case of monorepo or special structure, use the Netlify plugin for Next.js: @netlify/plugin-nextjs (already present in devDependencies)

Prisma & DB

- Ensure DATABASE_URL is available during build if Prisma generate needs remote introspection. Prefer generating Prisma client in CI or at build time using a local shadow DB or set PRISMA_CLIENT_ENGINE_TYPE if necessary.
- Use pnpm db:migrate or pnpm db:push in deployment only if migrations are part of the build process; prefer CI-managed migration step.

CI recommendations

- Run pnpm install --frozen-lockfile
- Run pnpm db:generate (or pnpm db:generate && pnpm typecheck) before pnpm build
- Run tests: pnpm test:thresholds and other vitest suites
- Run lint: pnpm lint

Troubleshooting

- If build times out, increase Netlify build timeout and ensure heavy steps (e.g., prisma generate) are cached.
- For Next.js App Router on Netlify, ensure @netlify/plugin-nextjs is configured in netlify.toml (already present).

Security

- Never commit secrets to the repo. Use Netlify environment variables and restrict access.
- Verify CORS and webhook endpoints securely handle secrets.

Post-deploy checks

- Smoke test critical routes: /, /admin, /api/health
- Verify Prisma Client works by calling a light endpoint that does not require Prod DB migrations

Notes

- I ran typecheck and unit thresholds tests locally; lint was executed and required one fix (replacing a require with a direct import of Prisma). If you want, I can re-run lint and fix any remaining style issues.
