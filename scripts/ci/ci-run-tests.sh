#!/usr/bin/env bash
set -euo pipefail

# This script is intended for CI use. It will:
# - Run conditional Prisma migrate (if DATABASE_URL is provided)
# - Run prisma generate
# - Run seed script if DATABASE_URL provided
# - Run unit tests and integration tests
# - Optionally run E2E if TARGET for E2E is configured (via E2E_BASE_URL or a built server)

echo "CI: Preparing DB and running tests"

# Ensure node toolchain
pnpm install --frozen-lockfile --silent

# Conditionally run migrations (script handles DATABASE_URL absence)
bash scripts/ci/run-prisma-migrate-if-db.sh

# Generate Prisma client
pnpm db:generate

# Seed DB only if DATABASE_URL is present
if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL detected — running seed"
  pnpm db:seed
else
  echo "No DATABASE_URL provided — skipping seed"
fi

# Run unit & integration tests
echo "Running unit & integration tests"
pnpm test

# Run E2E if requested (CI should set E2E=true and provide E2E_BASE_URL or allow script to start local server)
if [ "${E2E:-}" = "true" ]; then
  echo "Running E2E tests"
  # Ensure Playwright browsers are installed
  pnpm exec playwright install --with-deps
  # Use the e2e runner which starts the built server when needed
  bash e2e/run-e2e.sh "${E2E_BASE_URL:-}"
fi

echo "CI: All tasks completed"
