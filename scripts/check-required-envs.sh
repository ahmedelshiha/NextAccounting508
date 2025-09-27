#!/bin/bash

# Environment Variable Validation Script
# Purpose: Validate presence of required environment variables at build start
# This prevents deployment failures due to missing configuration

set -e

echo "🔍 Checking required environment variables..."

# Define required environment variables
REQUIRED_VARS=(
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "DATABASE_URL"
  "SENTRY_DSN"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "CRON_SECRET"
  "FROM_EMAIL"
)

# Define conditionally required variables based on environment
if [[ "$NODE_ENV" == "production" ]]; then
  REQUIRED_VARS+=(
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "SENDGRID_API_KEY"
  )
fi

# Check for missing variables
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    MISSING_VARS+=("$var")
  fi
done

# Report results
if [[ ${#MISSING_VARS[@]} -eq 0 ]]; then
  echo "✅ All required environment variables are set"
  echo "📋 Validated variables:"
  for var in "${REQUIRED_VARS[@]}"; do
    echo "  ✓ $var"
  done
else
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  ✗ $var"
  done
  echo ""
  echo "💡 Please set the missing variables in your environment or .env.local file"
  echo "📚 See docs/deployment-guide.md for configuration details"
  exit 1
fi

echo "🎉 Environment validation passed"