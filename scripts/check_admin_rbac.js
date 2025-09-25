#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const ADMIN_API_GLOB = 'src/app/api/admin/**/route.ts'
const files = glob.sync(ADMIN_API_GLOB)

const missing = []

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8')
  // Skip files where RBAC check is intentionally ignored
  if (content.includes('// RBAC_IGNORE')) continue

  const hasGetServerSession = /getServerSession\s*\(/.test(content)
  const hasHasPermission = /hasPermission\s*\(/.test(content)
  const hasAuthCheck = hasGetServerSession || hasHasPermission || /require\(['"]next-auth['"]\)/.test(content)

  if (!hasAuthCheck) {
    missing.push(f)
  }
}

if (missing.length > 0) {
  console.error('RBAC Audit FAILED: The following admin API route files do not appear to enforce authentication/authorization:')
  for (const m of missing) console.error(' -', m)
  console.error('\nIf a route is intentionally public or uses a different auth mechanism, add a comment "// RBAC_IGNORE" at the top of the file to skip this check.')
  process.exit(2)
}

console.log('RBAC Audit passed: all admin API routes include a getServerSession/hasPermission check or are explicitly ignored.')
process.exit(0)
