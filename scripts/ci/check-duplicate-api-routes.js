#!/usr/bin/env node
/**
 * CI helper: detect nested duplicate API route segments (e.g. /foo/foo).
 * Supports allowlist via scripts/ci/duplicates.allowlist.json (array of file paths relative to repo root).
 * Exits with code 1 if unallowed issues are found.
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

function loadAllowlist() {
  const allowPath = path.join(process.cwd(), 'scripts', 'ci', 'duplicates.allowlist.json')
  if (!fs.existsSync(allowPath)) return []
  try {
    const raw = fs.readFileSync(allowPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch (e) {
    console.warn('Warning: failed to parse duplicates.allowlist.json, ignoring allowlist')
  }
  return []
}

function main() {
  const apiRoot = path.join(process.cwd(), 'src', 'app', 'api')
  if (!fs.existsSync(apiRoot)) {
    console.log('No API directory found at src/app/api — skipping duplicate route check.')
    process.exit(0)
  }

  const files = walk(apiRoot).filter(f => f.endsWith('route.ts') || f.endsWith('route.js') || f.endsWith('route.tsx') || f.endsWith('route.jsx'))

  const nestedDuplicates = []
  for (const f of files) {
    const rel = path.relative(apiRoot, f).split(path.sep)
    const segments = rel.slice(0, -1)
    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i] === segments[i + 1]) {
        nestedDuplicates.push(path.relative(process.cwd(), f))
      }
    }
  }

  const allowlist = loadAllowlist()
  const unallowed = nestedDuplicates.filter(p => !allowlist.includes(p))

  if (unallowed.length) {
    console.error('\nDetected nested duplicate API route segments (e.g. /foo/foo) that are not allowlisted:')
    for (const p of unallowed) console.error(` - ${p}`)
    console.error('\nIf this is intentional, add the file path to scripts/ci/duplicates.allowlist.json')
    process.exit(1)
  }

  if (nestedDuplicates.length) {
    console.log('Detected nested duplicate API routes but all are allowlisted:')
    nestedDuplicates.forEach(p => console.log(` - ${p}`))
  }

  console.log('Duplicate API route check passed.')
}

main()
