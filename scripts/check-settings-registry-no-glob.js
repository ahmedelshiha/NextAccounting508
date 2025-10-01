#!/usr/bin/env node
// scripts/check-settings-registry-no-glob.js
// Validator that does not rely on external dependencies (no 'glob')

const fs = require('fs')
const path = require('path')

function readRegistry() {
  const file = path.join(__dirname, '..', 'src', 'lib', 'settings', 'registry.ts')
  if (!fs.existsSync(file)) throw new Error('registry.ts not found: ' + file)
  return fs.readFileSync(file, 'utf8')
}

function extractEntries(contents) {
  const keyRegex = /key:\s*'([^']+)'/g
  const routeRegex = /route:\s*'([^']+)'/g

  const keys = []
  const routes = []
  let m
  while ((m = keyRegex.exec(contents))) keys.push(m[1])
  while ((m = routeRegex.exec(contents))) routes.push(m[1])

  const entries = []
  for (let i = 0; i < Math.max(keys.length, routes.length); i++) {
    entries.push({ key: keys[i] || null, route: routes[i] || null })
  }
  return entries
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walkDir(full, fileList)
    else fileList.push(full)
  }
  return fileList
}

function scanAdminPages() {
  const base = path.join('src', 'app', 'admin')
  if (!fs.existsSync(base)) return []
  const files = walkDir(base)
  return files
    .filter(f => f.endsWith('page.tsx'))
    .map(f => {
      const rel = path.relative(path.join('src', 'app'), f)
      const segments = rel.split(path.sep)
      const adminIndex = segments.indexOf('admin')
      if (adminIndex === -1) return null
      const routeSegments = segments.slice(adminIndex + 1, segments.length - 1)
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

    const collisions = []
    for (const e of entries) {
      if (!e.route) continue
      if (e.route.startsWith('/admin/settings')) continue
      if (adminRoutes.includes(e.route)) collisions.push(e.route)
    }

    if (collisions.length) {
      console.warn('Registry routes colliding with existing admin pages:', collisions)
    }

    if (hasError) process.exit(1)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(2)
  }
}

if (require.main === module) main()
