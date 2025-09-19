#!/usr/bin/env bash
set -e

REQUIRED=(
  "DATABASE_URL"
  "NETLIFY_DATABASE_URL"
  "UPLOADS_PROVIDER"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
)

MISSING=()
for v in "${REQUIRED[@]}"; do
  if [ -z "${!v:-}" ]; then
    MISSING+=("$v")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "Missing required environment variables: ${MISSING[*]}"
  echo "Set them in your CI or host (Netlify/GitHub) before running migrations or deploys."
  exit 1
fi

echo "All required envs present."
