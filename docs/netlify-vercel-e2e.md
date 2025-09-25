# Running E2E on Netlify and Vercel (ephemeral approach)

We avoid adding Playwright to package.json and lockfile so main deploys remain stable. Use an ephemeral runner script that installs Playwright temporarily and runs tests.

Files provided:
- e2e/run-e2e.sh — Installs Playwright temporarily, installs browsers, starts local server (if no E2E_BASE_URL provided), runs tests, and cleans up.
- package.json script: pnpm e2e:ci (runs e2e/run-e2e.sh)

Options to run on Netlify
1. Manual run in Netlify build image (recommended for ad-hoc runs):
   - In Netlify UI, open "Deploys" → "Trigger deploy" → choose "Deploy site" and set a custom build command:
     PNPM_FLAGS="--no-frozen-lockfile" sh -c "pnpm install --no-frozen-lockfile && sh e2e/run-e2e.sh $E2E_BASE_URL"
   - Or run the same commands from a CI machine that has access to the repo and secrets.

2. Using a Netlify Build Plugin (advanced):
   - Create a small build plugin that runs e2e/run-e2e.sh in a separate lifecycle hook after `onPostBuild`.
   - This requires writing a plugin and adding it to netlify.toml.

Options to run on Vercel
1. Use a separate Vercel Build Hook or custom server to trigger an ephemeral runner in a separate environment (e.g., a small VM or runner with repo access).
2. Use Vercel CLI on a CI runner (e.g., GitHub Actions or self-hosted runner) to:
   - Checkout the repo
   - Run `pnpm install --frozen-lockfile`
   - Run `pnpm e2e:ci` (or `sh e2e/run-e2e.sh https://staging.example.com`)

Notes and recommendations
- For staging E2E against a deployed staging site, set E2E_BASE_URL to your staging URL and the script will skip starting a local server.
- CI environments often use frozen-lockfile; the script installs Playwright ephemeral with `--no-lockfile --no-save` so it doesn't modify package.json or pnpm-lock.yaml.
- Ensure secrets (API keys, test accounts) are available as repo/environment secrets when running tests in CI.

Troubleshooting
- If browsers cannot be installed in the build image, run `npx playwright install --with-deps` on a runner that allows installing system dependencies.
- If `pnpm install --frozen-lockfile` fails (outdated lockfile), run the production install step in a runner that has the correct lockfile. Avoid modifying lockfile in main pipeline.

