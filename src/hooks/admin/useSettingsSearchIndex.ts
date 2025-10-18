import { useMemo } from 'react'
import Fuse from 'fuse.js'
import SETTINGS_REGISTRY from '@/lib/settings/registry'

export type SettingsSearchItem = {
  key: string
  label: string
  route: string
  category: string
}

export function useSettingsSearchIndex() {
  const items: SettingsSearchItem[] = useMemo(() => {
    return (SETTINGS_REGISTRY || []).map((c) => ({
      key: c.key,
      label: c.label,
      route: c.route,
      category: c.key,
    }))
  }, [])

  const fuse = useMemo(() => {
    return new Fuse(items, {
      includeScore: true,
      threshold: 0.35,
      keys: [
        { name: 'label', weight: 0.7 },
        { name: 'key', weight: 0.3 },
      ],
    })
  }, [items])

  const categories = useMemo(() => {
    return items.map((i) => ({ key: i.category, label: i.label }))
  }, [items])

  return { items, fuse, categories }
}
