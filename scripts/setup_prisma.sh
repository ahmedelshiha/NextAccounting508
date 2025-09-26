#!/bin/bash
set -euo pipefail

echo "🧹 Cleaning up old installations..."
rm -rf node_modules || true
rm -rf .next || true
rm -f pnpm-lock.yaml || true
rm -rf .pnpm-store || true

echo "🧽 Pruning pnpm store..."
pnpm store prune || true

echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "✅ Approving build scripts..."
# Attempt non-interactive approval; safe to ignore if not supported
( echo "y" | pnpm approve-builds @prisma/client prisma @tailwindcss/oxide esbuild sharp @sentry/cli unrs-resolver ) || true

echo "🔨 Rebuilding native dependencies..."
pnpm rebuild || true

echo "🗄️ Generating Prisma client..."
pnpm prisma generate || pnpm db:generate

echo "✔️ Verifying Prisma client..."
node -e "const { PrismaClient } = require('@prisma/client'); new PrismaClient(); console.log('Prisma Client loaded successfully')"

echo "✅ All set!"
