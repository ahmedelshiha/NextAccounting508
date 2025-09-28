#!/bin/bash

# Environment Variable Validation Script
# Purpose: Validate presence of required environment variables at build start
# This prevents deployment failures due to missing configuration

set -e

echo "🔍 Checking required environment variables..."

# Define required environment variables with Netlify alternatives
CORE_VARS=(
  "DATABASE_URL|NETLIFY_DATABASE_URL"
  "FROM_EMAIL"
)

# Check if running in Netlify environment
if [[ "$NETLIFY" == "true" ]]; then
  echo "🌐 Detected Netlify environment"
  REQUIRED_VARS=(
    "${CORE_VARS[@]}"
    # Netlify provides these automatically or they're optional for build
  )
else
  echo "🖥️  Detected local/development environment"
  REQUIRED_VARS=(
    "${CORE_VARS[@]}"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
  )
fi

# Define conditionally required variables based on environment and context
# Only require payment/runtime variables for actual runtime deployment, not builds
if [[ "$NODE_ENV" == "production" && "$CI" != "true" && "$VERCEL" != "1" && "$NETLIFY" != "true" ]]; then
  echo "🚀 Production runtime detected - validating payment integration"
  REQUIRED_VARS+=(
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "SENDGRID_API_KEY"
  )
elif [[ -n "$SKIP_ENV_VALIDATION" ]]; then
  echo "⚠️  Environment validation skipped via SKIP_ENV_VALIDATION"
  exit 0
else
  echo "🔨 Build/CI environment detected - validating core variables only"
fi

# Check for missing variables
MISSING_VARS=()

for var_spec in "${REQUIRED_VARS[@]}"; do
  # Check if this is a variable with alternatives (contains |)
  if [[ "$var_spec" == *"|"* ]]; then
    # Split on | to get alternatives
    IFS='|' read -ra var_alternatives <<< "$var_spec"
    var_found=false
    
    for var in "${var_alternatives[@]}"; do
      if [[ -n "${!var}" ]]; then
        var_found=true
        break
      fi
    done
    
    if [[ "$var_found" == false ]]; then
      MISSING_VARS+=("$var_spec")
    fi
  else
    # Single variable check
    if [[ -z "${!var_spec}" ]]; then
      MISSING_VARS+=("$var_spec")
    fi
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