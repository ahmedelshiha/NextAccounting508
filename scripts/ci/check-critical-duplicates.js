#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const watchlist = [
  // critical names we want to ensure are single-source
  'SettingsNavigation.tsx',
  'usePerformanceMonitoring.ts',
]

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name)
    if (dirent.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function main() {
  const root = process.cwd()
  const src = path.join(root, 'src')
  const files = walk(src)
  const issues = []
  for (const base of watchlist) {
    const matches = files.filter(f => f.endsWith(base))
    if (matches.length > 1) {
      issues.push({ base, matches })
    }
  }

  if (issues.length) {
    console.error('\nDuplicate critical components/hooks detected:')
    for (const it of issues) {
      console.error(` - ${it.base}`)
      for (const m of it.matches) console.error(`   * ${path.relative(root, m)}`)
    }
    console.error('\nUnify these into a single source to avoid drift.')
    process.exit(1)
  }

  console.log('Critical duplicate check passed.')
}

main()
