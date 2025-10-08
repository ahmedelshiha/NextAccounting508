#!/usr/bin/env node
/*
 scripts/rbac.js
 Unified RBAC utilities: --check (static protection pattern scan) and --audit (detailed admin route audit)
 Usage: node scripts/rbac.js --check
        node scripts/rbac.js --audit
*/

const fs = require('fs')
const path = require('path')

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
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

const PROTECTION_REGEXES = [
  /applyRateLimit\s*\(/i,
  /rateLimitAsync\s*\(/i,
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
  for (const rx of PROTECTION_REGEXES) if (rx.test(content)) return true
  return false
}

function isAdminPath(p) {
  const rel = p.split(path.sep).join('/')
  return rel.includes('/src/app/api/admin/') || rel.includes('/src/app/admin/') || rel.includes('/src/components/admin/')
}

// Audit mode helpers (route-level checks)
function checkRBACPatterns(content) {
  return {
    hasGetServerSession: content.includes('getServerSession'),
    hasPermissionCheck: content.includes('hasPermission'),
    hasSessionUserCheck: content.includes('session?.user') || content.includes("session && session.user") || content.includes('session.user'),
    hasUnauthorizedResponse: content.includes("401") || content.includes("403"),
    hasAuthImport: content.includes("from '@/lib/auth'") || content.includes('from "@/lib/auth"') || content.includes("from '@/lib/auth'") || content.includes('from "@/lib/auth"'),
    hasPermissionsImport: content.includes("from '@/lib/permissions'") || content.includes('from "@/lib/permissions"') || content.includes("from '@/lib/permissions'")
  }
}

function scanDirectory(dirPath, results = []) {
  if (!fs.existsSync(dirPath)) return results
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) scanDirectory(fullPath, results)
    else if (entry.name === 'route.ts' || entry.name === 'route.js') results.push(fullPath)
  }
  return results
}

async function runCheckMode() {
  const root = process.cwd()
  const files = walk(path.join(root, 'src'))
  const adminFiles = files.filter(isAdminPath)

  const failures = []
  for (const f of adminFiles) {
    const c = readFileSafe(f)
    const trimmed = c.trim()
    if (!trimmed) continue
    if (/\.test\./i.test(f) || /__tests__/.test(f)) continue

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

async function runAuditMode() {
  const adminApiPath = path.join(__dirname, '../src/app/api/admin')
  if (!fs.existsSync(adminApiPath)) {
    console.error('Admin API directory not found:', adminApiPath)
    process.exit(1)
  }
  const routeFiles = scanDirectory(adminApiPath)
  if (routeFiles.length === 0) {
    console.log('No route files found in admin API directory')
    return
  }

  const results = { secure: [], missing: [], partial: [], errors: [] }
  for (const filePath of routeFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const relativePath = path.relative(process.cwd(), filePath)
      const checks = checkRBACPatterns(content)

      const hasAuth = checks.hasGetServerSession && checks.hasSessionUserCheck
      const hasPermissions = checks.hasPermissionCheck && checks.hasPermissionsImport
      const hasProperResponses = checks.hasUnauthorizedResponse

      if (hasAuth && hasPermissions && hasProperResponses) results.secure.push({ path: relativePath, status: '✅ Secure', checks })
      else if (hasAuth && (hasPermissions || hasProperResponses)) results.partial.push({ path: relativePath, status: '⚠️  Partially Secure', checks, missing: { permissions: !hasPermissions, responses: !hasProperResponses } })
      else results.missing.push({ path: relativePath, status: '❌ Missing RBAC', checks, missing: { auth: !hasAuth, permissions: !hasPermissions, responses: !hasProperResponses } })
    } catch (error) {
      results.errors.push({ path: path.relative(process.cwd(), filePath), error: error.message })
    }
  }

  // Report
  console.log('📈 RBAC Audit Results:\n')
  if (results.secure.length > 0) {
    console.log(`✅ Secure Routes (${results.secure.length}):`)
    results.secure.forEach(route => console.log(`   ${route.path}`))
    console.log()
  }
  if (results.partial.length > 0) {
    console.log(`⚠️  Partially Secure Routes (${results.partial.length}):`)
    results.partial.forEach(route => {
      console.log(`   ${route.path}`)
      if (route.missing.permissions) console.log(`      - Missing: hasPermission check`)
      if (route.missing.responses) console.log(`      - Missing: 401/403 responses`)
    })
    console.log()
  }
  if (results.missing.length > 0) {
    console.log(`❌ Missing RBAC Routes (${results.missing.length}):`)
    results.missing.forEach(route => {
      console.log(`   ${route.path}`)
      if (route.missing.auth) console.log(`      - Missing: getServerSession + session?.user check`)
      if (route.missing.permissions) console.log(`      - Missing: hasPermission check`)
      if (route.missing.responses) console.log(`      - Missing: 401/403 responses`)
    })
    console.log()
  }
  if (results.errors.length > 0) {
    console.log(`🔥 Errors (${results.errors.length}):`)
    results.errors.forEach(result => console.log(`   ${result.path}: ${result.error}`))
    console.log()
  }

  const total = results.secure.length + results.partial.length + results.missing.length
  const securePercentage = total > 0 ? Math.round((results.secure.length / total) * 100) : 0
  console.log('📋 Summary:')
  console.log(`   Total Routes: ${total}`)
  console.log(`   Secure: ${results.secure.length} (${securePercentage}%)`)
  console.log(`   Partially Secure: ${results.partial.length}`)
  console.log(`   Missing RBAC: ${results.missing.length}`)
  console.log(`   Errors: ${results.errors.length}`)

  if (results.missing.length > 0 || results.errors.length > 0) {
    console.log('\n🚨 Security issues detected! Please fix missing RBAC implementations.')
    process.exit(1)
  } else if (results.partial.length > 0) {
    console.log('\n⚠️  Some routes need attention. Consider adding comprehensive RBAC.')
    process.exit(0)
  } else {
    console.log('\n🎉 All admin routes have proper RBAC implementation!')
    process.exit(0)
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log('Usage: node scripts/rbac.js --check | --audit')
    process.exit(0)
  }
  if (args.includes('--check')) await runCheckMode()
  else if (args.includes('--audit')) await runAuditMode()
  else { console.error('Unknown option. Use --check or --audit'); process.exit(1) }
}

if (require.main === module) main()
