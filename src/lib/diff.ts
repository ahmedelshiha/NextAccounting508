export type DiffChange = { path: string; before: any; after: any; type: 'added'|'removed'|'changed' }

export function jsonDiff(before: any, after: any, basePath: string = ''): DiffChange[] {
  const changes: DiffChange[] = []
  const isObject = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v)

  const beforeKeys = new Set(Object.keys(isObject(before) ? before : {}))
  const afterKeys = new Set(Object.keys(isObject(after) ? after : {}))

  // Removed keys
  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      const p = basePath ? `${basePath}.${key}` : key
      changes.push({ path: p, before: before[key], after: undefined, type: 'removed' })
    }
  }
  // Added keys
  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) {
      const p = basePath ? `${basePath}.${key}` : key
      changes.push({ path: p, before: undefined, after: after[key], type: 'added' })
    }
  }
  // Changed keys
  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) continue
    const p = basePath ? `${basePath}.${key}` : key
    const bv = before[key]
    const av = after[key]
    if (isObject(bv) && isObject(av)) {
      changes.push(...jsonDiff(bv, av, p))
    } else if (Array.isArray(bv) && Array.isArray(av)) {
      if (JSON.stringify(bv) !== JSON.stringify(av)) {
        changes.push({ path: p, before: bv, after: av, type: 'changed' })
      }
    } else if (bv !== av) {
      changes.push({ path: p, before: bv, after: av, type: 'changed' })
    }
  }

  return changes
}
