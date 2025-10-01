#!/usr/bin/env node
// scripts/check-settings-registry.js
// Simple validator for src/lib/settings/registry.ts.
// - Ensures `key` values are unique
// - Ensures `route` values are unique
// - Warns if any registry route collides with existing top-level admin routes (src/app/admin/*/page.tsx)

const fs = require('fs')
const path = require('path')
const glob = require('glob')

function readRegistry() {
  const file = path.join(__dirname, '..', 'src', 'lib', 'settings', 'registry.ts')
  if (!fs.existsSync(file)) throw new Error('registry.ts not found: ' + file)
  return fs.readFileSync(file, 'utf8')
}

function extractEntries(contents) {
  // crude regex extraction for key and route pairs
  const keyRegex = /key:\s*'([^']+)'/g
  const routeRegex = /route:\s*'([^']+)'/g

  const keys = []
  const routes = []
  let m
  while ((m = keyRegex.exec(contents))) {
    keys.push(m[1])
  }
  while ((m = routeRegex.exec(contents))) {
    routes.push(m[1])
  }
  if (keys.length !== routes.length) {
    // Not critical but warn
    console.warn('Warning: number of keys and routes parsed differ. Parsed keys:', keys.length, 'routes:', routes.length)
  }
  const entries = []
  for (let i = 0; i < Math.max(keys.length, routes.length); i++) {
    entries.push({ key: keys[i] || null, route: routes[i] || null })
  }
  return entries
}

function scanAdminPages() {
  const pattern = path.join('src', 'app', 'admin', '**', 'page.tsx')
  const files = glob.sync(pattern, { nodir: true })
  // map file path to route. e.g., src/app/admin/users/page.tsx -> /admin/users
  return files.map(f => {
    const rel = path.relative(path.join('src', 'app'), f)
    const segments = rel.split(path.sep) // e.g., admin/users/page.tsx or admin/settings/booking/page.tsx
    // get the path under /admin
    const adminIndex = segments.indexOf('admin')
    if (adminIndex === -1) return null
    const routeSegments = segments.slice(adminIndex + 1, segments.length - 1) // exclude page.tsx
    return '/' + ['admin', ...routeSegments].filter(Boolean).join('/')
  }).filter(Boolean)
}

function main() {
  try {
    const contents = readRegistry()
    const entries = extractEntries(contents)

    const keyCounts = entries.reduce((acc, e) => {
      if (!e.key) return acc
      acc[e.key] = (acc[e.key] || 0) + 1
      return acc
    }, {})
    const routeCounts = entries.reduce((acc, e) => {
      if (!e.route) return acc
      acc[e.route] = (acc[e.route] || 0) + 1
      return acc
    }, {})

    let hasError = false

    for (const [k, count] of Object.entries(keyCounts)) {
      if (count > 1) {
        console.error('Duplicate registry key found:', k)
        hasError = true
      }
    }
    for (const [r, count] of Object.entries(routeCounts)) {
      if (count > 1) {
        console.error('Duplicate registry route found:', r)
        hasError = true
      }
    }

    const adminRoutes = scanAdminPages()

    // detect collisions between registry routes and top-level admin routes (excluding settings routes)
    const collisions = []
    for (const e of entries) {
      if (!e.route) continue
      // ignore entries that are under /admin/settings
      if (e.route.startsWith('/admin/settings')) continue
      if (adminRoutes.includes(e.route)) collisions.push(e.route)
    }

    if (collisions.length) {
      console.warn('Registry routes colliding with existing admin pages:', collisions)
      // not necessarily fatal; warn
    }

    if (hasError) process.exit(1)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(2)
  }
}

if (require.main === module) main()
