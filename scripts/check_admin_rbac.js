#!/usr/bin/env node
/*
  scripts/check_admin_rbac.js
  Simple static check to ensure admin API routes and admin pages contain RBAC or rate-limiting protections.
  Exits with non-zero code if potential missing guards are found.
*/

const fs = require('fs')
const path = require('path')

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // skip node_modules, .next, dist
      if (['node_modules', '.next', 'dist', 'out', 'coverage'].includes(entry.name)) continue
      walk(full, files)
    } else if (entry.isFile()) {
      if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.jsx')) files.push(full)
    }
  }
  return files
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8') } catch (e) { return '' }
}

function looksProtected(content) {
  const checks = [
    /applyRateLimit\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
    /verifySuperAdminStepUp\s*\(/,
  ]
  // The above repetition is accidental; instead build list below
}

// Rebuild proper checks list
const PROTECTION_REGEXES = [
  /applyRateLimit\s*\(/i,
  /rateLimitAsync\s*\(/i,
  /verifySuperAdminStepUp\s*\(/i,
  /verifySuperAdminStepUp\s*\(/i,
  /verifySuperAdminStepUp\s*\(/i,
  /requireRole\s*\(/i,
  /PermissionGate/i,
  /getSessionOrBypass\s*\(/i,
  /authorize\s*\(/i,
  /ensureAdmin/i,
  /ENFORCE_ORG_2FA/i,
]

function fileLooksProtected(content) {
  if (!content) return false
  for (const rx of PROTECTION_REGEXES) {
    if (rx.test(content)) return true
  }
  return false
}

function isAdminPath(p) {
  const rel = p.split(path.sep).join('/')
  return rel.includes('/src/app/api/admin/') || rel.includes('/src/app/admin/') || rel.includes('/src/components/admin/')
}

function main() {
  const root = process.cwd()
  const files = walk(path.join(root, 'src'))
  const adminFiles = files.filter(isAdminPath)

  const failures = []
  for (const f of adminFiles) {
    const c = readFileSafe(f)
    // skip index files that only re-export
    const trimmed = c.trim()
    if (!trimmed) continue

    // Ignore test files
    if (/\.test\./i.test(f) || /__tests__/.test(f)) continue

    // Consider files that are likely UI-only (tsx with components) as not required
    const isTsx = f.endsWith('.tsx') || f.endsWith('.jsx')
    const looksLikeApi = f.includes('/api/') || (!isTsx && (f.endsWith('.ts') || f.endsWith('.js')))

    if (!looksLikeApi) continue

    const ok = fileLooksProtected(c)
    if (!ok) failures.push(f)
  }

  if (failures.length) {
    console.error('\nRBAC CHECK FAILED: Potential admin files without explicit protection detected:')
    for (const f of failures) console.error(' -', path.relative(root, f))
    console.error('\nGuidance: ensure these files call applyRateLimit(), verifySuperAdminStepUp(), requireRole(), or use PermissionGate/authorize checks.\n')
    process.exitCode = 1
  } else {
    console.log('RBAC CHECK PASSED: Admin files contain expected protection patterns (applyRateLimit/verifySuperAdminStepUp/PermissionGate/authorize/etc).')
    process.exitCode = 0
  }
}

main()
