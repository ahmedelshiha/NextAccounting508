#!/usr/bin/env node

/**
 * Admin RBAC Audit Script
 * 
 * This script audits all /api/admin/** routes to ensure they have proper
 * getServerSession + hasPermission guards implemented.
 * 
 * Usage: node scripts/audit-admin-rbac.js
 */

const fs = require('fs')
const path = require('path')

const adminApiPath = path.join(__dirname, '../src/app/api/admin')

/**
 * Check if a file contains required RBAC patterns
 */
function checkRBACPatterns(filePath, content) {
  const checks = {
    hasGetServerSession: content.includes('getServerSession'),
    hasPermissionCheck: content.includes('hasPermission'),
    hasSessionUserCheck: content.includes('session?.user'),
    hasUnauthorizedResponse: content.includes('401') || content.includes('403'),
    hasAuthImport: content.includes('from \'@/lib/auth\'') || content.includes('from "@/lib/auth"'),
    hasPermissionsImport: content.includes('from \'@/lib/permissions\'') || content.includes('from "@/lib/permissions"')
  }

  return checks
}

/**
 * Recursively scan directory for route files
 */
function scanDirectory(dirPath, results = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results)
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * Main audit function
 */
function auditAdminRoutes() {
  console.log('🔍 Auditing Admin API Routes for RBAC Implementation...\n')

  if (!fs.existsSync(adminApiPath)) {
    console.error('❌ Admin API directory not found:', adminApiPath)
    process.exit(1)
  }

  const routeFiles = scanDirectory(adminApiPath)
  
  if (routeFiles.length === 0) {
    console.log('📝 No route files found in admin API directory')
    return
  }

  console.log(`📊 Found ${routeFiles.length} admin route files to audit\n`)

  const results = {
    secure: [],
    missing: [],
    partial: [],
    errors: []
  }

  for (const filePath of routeFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const relativePath = path.relative(process.cwd(), filePath)
      const checks = checkRBACPatterns(filePath, content)
      
      // Determine route security status
      const hasAuth = checks.hasGetServerSession && checks.hasSessionUserCheck
      const hasPermissions = checks.hasPermissionCheck && checks.hasPermissionsImport
      const hasProperResponses = checks.hasUnauthorizedResponse

      if (hasAuth && hasPermissions && hasProperResponses) {
        results.secure.push({
          path: relativePath,
          status: '✅ Secure',
          checks
        })
      } else if (hasAuth && (hasPermissions || hasProperResponses)) {
        results.partial.push({
          path: relativePath,
          status: '⚠️  Partially Secure',
          checks,
          missing: {
            permissions: !hasPermissions,
            responses: !hasProperResponses
          }
        })
      } else {
        results.missing.push({
          path: relativePath,
          status: '❌ Missing RBAC',
          checks,
          missing: {
            auth: !hasAuth,
            permissions: !hasPermissions,
            responses: !hasProperResponses
          }
        })
      }
    } catch (error) {
      results.errors.push({
        path: path.relative(process.cwd(), filePath),
        error: error.message
      })
    }
  }

  // Report results
  console.log('📈 RBAC Audit Results:\n')

  if (results.secure.length > 0) {
    console.log(`✅ Secure Routes (${results.secure.length}):`)
    results.secure.forEach(route => {
      console.log(`   ${route.path}`)
    })
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
    results.errors.forEach(result => {
      console.log(`   ${result.path}: ${result.error}`)
    })
    console.log()
  }

  // Summary
  const total = results.secure.length + results.partial.length + results.missing.length
  const securePercentage = total > 0 ? Math.round((results.secure.length / total) * 100) : 0
  
  console.log('📋 Summary:')
  console.log(`   Total Routes: ${total}`)
  console.log(`   Secure: ${results.secure.length} (${securePercentage}%)`)
  console.log(`   Partially Secure: ${results.partial.length}`)
  console.log(`   Missing RBAC: ${results.missing.length}`)
  console.log(`   Errors: ${results.errors.length}`)

  // Exit with error code if security issues found
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

// Run the audit
if (require.main === module) {
  auditAdminRoutes()
}