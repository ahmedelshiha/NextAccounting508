#!/usr/bin/env bash
set -euo pipefail

# Ephemeral E2E runner for Netlify/Vercel
# Uses local @playwright/test version to avoid version mismatches.
# Usage: ./e2e/run-e2e.sh [BASE_URL]
# If BASE_URL not provided, script will start the already-built app locally and test http://localhost:3000

BASE_URL=${1:-}

echo "Starting ephemeral E2E runner"
corepack enable >/dev/null 2>&1 || true

# Install Playwright browsers using the local version to prevent version skew
if command -v pnpm >/dev/null 2>&1; then
  echo "Installing Playwright browsers (local version)"
  pnpm exec playwright install chromium
else
  echo "pnpm not available" >&2
  exit 1
fi

start_local_server() {
  echo "Starting app for local testing..."
  # Prefer standalone server if available to avoid 'next start' warning and speed up boot
  if [ -f ".next/standalone/server.js" ]; then
    NODE_ENV=production PORT=3000 node .next/standalone/server.js &
  else
    # Fall back to next start (assumes app already built by Netlify build step)
    pnpm start &
  fi
  APP_PID=$!
  # Wait for server to respond (max 120s)
  n=0
  until curl -sSf "http://localhost:3000" >/dev/null || [ $n -ge 120 ]; do n=$((n+1)); sleep 1; done
  if [ $n -ge 120 ]; then
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
}
trap cleanup EXIT

if [ -z "$BASE_URL" ]; then
  # Do NOT rebuild here; build already completed in Netlify build step
  start_local_server
  TARGET_URL="http://localhost:3000"
else
  TARGET_URL="$BASE_URL"
fi

echo "Running Playwright tests against $TARGET_URL"
E2E_BASE_URL="$TARGET_URL" pnpm exec playwright test --config=e2e/playwright.config.ts --reporter=list

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "E2E tests failed with exit code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi

echo "E2E tests passed"
exit 0
