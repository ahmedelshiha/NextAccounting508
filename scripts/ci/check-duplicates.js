#!/usr/bin/env node
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
      files.push(full)
    }
  }
  return files
}

function normalizeRouteFromPath(filePath) {
  // Expect filePath like src/app/api/.../route.ts
  const parts = filePath.split(path.sep)
  const apiIndex = parts.indexOf('api')
  if (apiIndex === -1) return null
  const routeParts = parts.slice(apiIndex + 1)
  // remove filename 'route.ts' or 'route.js'
  if (routeParts.length === 0) return null
  routeParts[routeParts.length - 1] = path.basename(routeParts[routeParts.length - 1], path.extname(routeParts[routeParts.length - 1]))
  // remove trailing 'route'
  if (routeParts[routeParts.length - 1] === 'route') routeParts.pop()
  // build normalized path
  const route = '/' + routeParts.join('/')
  // replace dynamic segments [id] with :id
  return route.replace(/\[([^\]]+)\]/g, ':$1')
}

function findDuplicateRoutes(root) {
  const files = walk(path.join(root, 'src'))
  const routeFiles = files.filter(f => f.includes(path.join('src', 'app', 'api')) && path.basename(f).startsWith('route'))
  const map = {}
  for (const f of routeFiles) {
    const r = normalizeRouteFromPath(f)
    if (!r) continue
    map[r] = map[r] || []
    map[r].push(path.relative(root, f))
  }
  const duplicates = Object.entries(map).filter(([, arr]) => arr.length > 1)
  return duplicates
}

function findDuplicateComponentBasenames(root) {
  const files = walk(path.join(root, 'src', 'components'))
  const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.js'))
  const map = {}
  for (const f of tsxFiles) {
    const base = path.basename(f)
    map[base] = map[base] || []
    map[base].push(path.relative(root, f))
  }
  const duplicates = Object.entries(map).filter(([, arr]) => arr.length > 1)
  // Filter to critical areas (admin settings navigation names)
  const critical = duplicates.filter(([name]) => name.toLowerCase().includes('settingsnavigation') || name.toLowerCase().includes('settingshell') || name.toLowerCase().includes('settingsoverview'))
  return { duplicates, critical }
}

function main() {
  const root = process.cwd()
  const dupRoutes = findDuplicateRoutes(root)
  const { duplicates: dupComps, critical } = findDuplicateComponentBasenames(root)

  let failed = false

  if (dupRoutes.length) {
    console.error('\nDuplicate route paths detected:')
    for (const [route, files] of dupRoutes) {
      console.error(` - ${route}`)
      for (const f of files) console.error(`    - ${f}`)
    }
    failed = true
  } else {
    console.log('No duplicate API route paths detected')
  }

  if (critical.length) {
    console.error('\nDuplicate critical component basenames detected:')
    for (const [name, files] of critical) {
      console.error(` - ${name}`)
      for (const f of files) console.error(`    - ${f}`)
    }
    failed = true
  } else {
    console.log('No critical duplicate component basenames detected')
  }

  // Optionally list other duplicate component basenames (non-critical) as warnings
  const nonCritical = dupComps.filter(([name]) => !critical.find(c => c[0] === name))
  if (nonCritical.length) {
    console.warn('\nNon-critical duplicate component basenames (review for potential drift):')
    for (const [name, files] of nonCritical) {
      console.warn(` - ${name}: ${files.length} occurrences`)
    }
  }

  if (failed) process.exitCode = 1
  else process.exitCode = 0
}

if (require.main === module) main()
