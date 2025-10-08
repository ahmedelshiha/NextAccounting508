#!/usr/bin/env node
/**
 * CI helper: detect nested duplicate API route segments and duplicate route basenames
 * Exits with code 1 if issues are found.
 * Usage: node scripts/ci/check-duplicate-api-routes.js
 */
const fs = require('fs')
const path = require('path')

function walk(dir) {
  const results = []
  const list = fs.readdirSync(dir, { withFileTypes: true })
  for (const dirent of list) {
    const full = path.join(dir, dirent.name)
    if (dirent.isDirectory()) results.push(...walk(full))
    else results.push(full)
  }
  return results
}

function main() {
  const apiRoot = path.join(process.cwd(), 'src', 'app', 'api')
  if (!fs.existsSync(apiRoot)) {
    console.log('No API directory found at src/app/api — skipping duplicate route check.')
    process.exit(0)
  }

  const files = walk(apiRoot).filter(f => f.endsWith('route.ts') || f.endsWith('route.js') || f.endsWith('route.tsx') || f.endsWith('route.jsx'))

  const nestedDuplicates = []
  const basenameMap = new Map()

  for (const f of files) {
    const rel = path.relative(apiRoot, f).split(path.sep)
    // remove the filename
    const segments = rel.slice(0, -1)
    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i] === segments[i + 1]) {
        nestedDuplicates.push({ file: f, segment: segments[i], index: i })
      }
    }

    const base = path.basename(f)
    basenameMap.set(base, (basenameMap.get(base) || []).concat(f))
  }

  const duplicatesByBasename = Array.from(basenameMap.entries()).filter(([, arr]) => arr.length > 1)

  let hasIssues = false

  if (nestedDuplicates.length) {
    hasIssues = true
    console.error('\nDetected nested duplicate API route segments (e.g. /foo/foo):')
    for (const d of nestedDuplicates) {
      console.error(` - ${path.relative(process.cwd(), d.file)} (repeated segment: "${d.segment}")`)
    }
  }

  if (duplicatesByBasename.length) {
    hasIssues = true
    console.error('\nDetected route files sharing the same basename across API tree:')
    for (const [base, list] of duplicatesByBasename) {
      console.error(` - ${base}:`)
      for (const p of list) console.error(`    * ${path.relative(process.cwd(), p)}`)
    }
    console.error('\nThis may be intentional; if so add an allowlist or adjust structure. Consider consolidating shared handlers into a common util.')
  }

  if (hasIssues) process.exit(1)
  console.log('Duplicate API route check passed.')
}

main()
