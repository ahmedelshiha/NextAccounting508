# Netlify Post-Build E2E Plugin

This repository includes a Netlify Build Plugin at netlify/plugins/run-e2e which runs the ephemeral E2E runner (e2e/run-e2e.sh) after a successful build.

How it works
- The plugin executes in the `onPostBuild` lifecycle hook.
- To prevent tests from running on every deploy, the plugin only runs when the environment variable RUN_E2E is set to `true`.

How to enable
1. In Netlify site settings -> Environment -> Add a new environment variable:
   - Key: RUN_E2E
   - Value: true
2. Ensure required secrets are present (E2E_BASE_URL, test credentials) in Netlify environment variables.

Notes
- The plugin runs inside the build image; Playwright browsers installation may require system dependencies. If browsers cannot install in the build image, run the E2E runner from an external CI runner instead.
- The E2E runner installs Playwright temporarily (no-save) and cleans up after itself, so package.json and pnpm-lock.yaml are not modified.

If you want E2E only on certain branches (e.g., main), set RUN_E2E via Netlify context-specific environment variables.
