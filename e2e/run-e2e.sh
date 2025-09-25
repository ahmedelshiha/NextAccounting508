#!/usr/bin/env bash
#!/usr/bin/env bash
set -euo pipefail

# Ephemeral E2E runner for Netlify/Vercel
# Installs Playwright as a temporary dev dependency (no-save), installs browsers, runs tests, then exits.

# Usage: ./e2e/run-e2e.sh [BASE_URL]
# If BASE_URL not provided, script will build and start the app locally and test http://localhost:3000

BASE_URL=${1:-}

echo "Starting ephemeral E2E runner"
corepack enable

# Ensure production deps are installed
pnpm install --frozen-lockfile

# Install Playwright temporarily without modifying package.json or lockfile
echo "Installing @playwright/test temporarily"
pnpm add -D @playwright/test@latest --no-lockfile --no-save

# Install browsers
npx playwright install --with-deps

start_local_server() {
  echo "Building and starting app for local testing..."
  pnpm build
  pnpm start &
  APP_PID=$!
  # wait for server to respond
  n=0
  until curl -sSf "http://localhost:3000" >/dev/null || [ $n -ge 60 ]; do n=$((n+1)); sleep 1; done
  if [ $n -ge 60 ]; then
    echo "Local server did not start in time" >&2
    kill $APP_PID || true
    exit 1
  fi
}

cleanup() {
  echo "Cleaning up"
  if [ -n "${APP_PID:-}" ]; then
    kill $APP_PID || true
  fi
  # Remove temporary playwright package from node_modules
  pnpm -w remove @playwright/test --no-save || true
}
trap cleanup EXIT

if [ -z "$BASE_URL" ]; then
  start_local_server
  TARGET_URL="http://localhost:3000"
else
  TARGET_URL="$BASE_URL"
fi

echo "Running Playwright tests against $TARGET_URL"
E2E_BASE_URL="$TARGET_URL" npx playwright test --config=e2e/playwright.config.ts --reporter=list

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "E2E tests failed with exit code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi

echo "E2E tests passed"
exit 0
