# Build Troubleshooting Guide

## Environment Variable Validation Errors

### Issue: Missing Stripe Environment Variables

If you encounter this error during build:
```
❌ Missing required environment variables:
  ✗ STRIPE_SECRET_KEY
  ✗ STRIPE_PUBLISHABLE_KEY  
  ✗ STRIPE_WEBHOOK_SECRET
```

### Solutions

#### Option 1: Skip Environment Validation (Recommended for Build Issues)

Use the skip-env build command:
```bash
pnpm run build:skip-env
```

Or set the skip flag manually:
```bash
SKIP_ENV_VALIDATION=true pnpm build
```

#### Option 2: Set Placeholder Values for Build

Create a `.env.local` file with placeholder values:
```env
# Build-time placeholders (not for production)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

#### Option 3: Use CI Environment

Set the CI flag to skip payment validation:
```bash
CI=true pnpm build
```

### Understanding Environment Validation

The environment validation script has different requirements based on context:

#### Build/CI Environments
- **Required**: Database connection, basic auth setup
- **Optional**: Payment processing, email services
- **Detection**: `CI=true`, `VERCEL=1`, or `NETLIFY=true`

#### Production Runtime
- **Required**: All variables including Stripe, SendGrid
- **Detection**: `NODE_ENV=production` + not in CI/build environment

#### Netlify Deployments
- **Required**: `NETLIFY_DATABASE_URL`, `FROM_EMAIL`
- **Optional**: Payment variables (set via Netlify dashboard)
- **Detection**: `NETLIFY=true`

### Environment Variable Priority

The script checks variables in this order:

1. **Database**: `DATABASE_URL` or `NETLIFY_DATABASE_URL`
2. **Auth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (if not CI/Netlify)
3. **Email**: `FROM_EMAIL`
4. **Payments**: Stripe variables (production runtime only)
5. **Services**: SendGrid, Redis (production runtime only)

### Quick Fix Commands

```bash
# Skip validation entirely
SKIP_ENV_VALIDATION=true pnpm build

# Build with minimal env check
CI=true pnpm build

# Use the dedicated skip-env script
pnpm run build:skip-env

# Check what variables are being validated
pnpm run check:env
```

### Production Deployment

For production deployments, ensure all environment variables are properly set:

#### Netlify
Set these in the Netlify dashboard → Site settings → Environment variables:
- `NETLIFY_DATABASE_URL` (auto-provided if using Netlify Database)
- `FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### Vercel
Set these in the Vercel dashboard → Project → Settings → Environment Variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### Other Platforms
Ensure all required variables are set in your platform's environment configuration.

### Development Setup

For local development, copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### Testing Environment Validation

Test the validation script with different scenarios:

```bash
# Test local environment
pnpm run check:env

# Test with skip flag
SKIP_ENV_VALIDATION=true pnpm run check:env

# Test Netlify environment
NETLIFY=true NETLIFY_DATABASE_URL=test FROM_EMAIL=test@example.com pnpm run check:env

# Test CI environment
CI=true DATABASE_URL=test FROM_EMAIL=test@example.com pnpm run check:env
```

This helps you understand what variables are required in each context.