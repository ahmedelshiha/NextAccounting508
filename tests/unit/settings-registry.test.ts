import { describe, it, expect } from 'vitest'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import fs from 'fs'
import path from 'path'

function walkDir(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walkDir(full, fileList)
    else fileList.push(full)
  }
  return fileList
}

function adminRoutesFromFiles(): string[] {
  const base = path.join('src', 'app')
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
    })
    .filter(Boolean) as string[]
}

describe('SETTINGS_REGISTRY validity', () => {
  it('has unique keys', () => {
    const keys = SETTINGS_REGISTRY.map(e => e.key).filter(Boolean)
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i)
    expect(dup).toEqual([])
  })

  it('has unique routes', () => {
    const routes = SETTINGS_REGISTRY.map(e => e.route).filter(Boolean)
    const dup = routes.filter((r, i) => routes.indexOf(r) !== i)
    expect(dup).toEqual([])
  })

  it('does not collide with top-level admin routes (except /admin/settings)', () => {
    const adminRoutes = adminRoutesFromFiles()
    const collisions = SETTINGS_REGISTRY
      .map(e => e.route)
      .filter(Boolean)
      .filter(r => !r.startsWith('/admin/settings'))
      .filter(r => adminRoutes.includes(r))
    expect(collisions).toEqual([])
  })
})
