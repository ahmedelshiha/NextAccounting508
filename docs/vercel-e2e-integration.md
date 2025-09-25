# Vercel E2E Integration (recommended approach)

Vercel does not support arbitrary post-deploy commands on the build server that can install ephemeral devDependencies. Recommended approaches:

1) Use an external CI runner (GitHub Actions, self-hosted, or other) that is triggered by Vercel Deploy Hook:
   - Create a Vercel Deploy Hook for the project (Vercel project settings -> Git -> Deploy Hooks).
   - Configure Vercel to call the deploy hook after deployment (or trigger your external runner when a deployment completes).
   - External runner flow:
     - Checkout repo
     - Install production deps: `pnpm install --frozen-lockfile`
     - Run `pnpm e2e:ci` (this runs e2e/run-e2e.sh which will install Playwright temporarily and run tests against E2E_BASE_URL)

2) Or run E2E against the staging URL directly from a CI job:
   - In GitHub Actions or other CI, add a job that waits for Vercel deployment to finish, retrieves the preview URL, and then runs `pnpm e2e:ci https://your-preview-url`.

3) Notes on secrets and environment variables:
   - Store E2E credentials in CI secrets and pass them to the runner.
   - e2e/run-e2e.sh accepts a URL argument; if omitted it builds and runs locally.

Example GitHub Action step (triggered by Vercel webhook):

- name: Run E2E after Vercel deploy
  run: |
    corepack enable
    pnpm install --frozen-lockfile
    pnpm e2e:ci $DEPLOY_URL
  env:
    E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}


This keeps Vercel builds clean while enabling full E2E coverage using a separate runner that can install devDependencies.
