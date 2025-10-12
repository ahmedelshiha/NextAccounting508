"use client"

import React from 'react'
import { Star, StarOff } from 'lucide-react'
import { addFavorite, removeFavorite, getFavorites, readFavoritesCachedMap } from '@/services/favorites.service'
import { Button } from '@/components/ui/button'

export default function FavoriteToggle({ settingKey, route, label, initiallyPinned = false, onChange }: {
  settingKey: string
  route: string
  label: string
  initiallyPinned?: boolean
  onChange?: (pinned: boolean) => void
}) {
  const [pinned, setPinned] = React.useState<boolean>(() => {
    if (initiallyPinned) return true
    try {
      const map = readFavoritesCachedMap()
      if (map && Object.prototype.hasOwnProperty.call(map, settingKey)) return Boolean(map[settingKey])
    } catch {}
    return false
  })
  const [working, setWorking] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    if (!initiallyPinned) {
      ;(async () => {
        try {
          const items = await getFavorites()
          if (!mounted) return
          const found = Array.isArray(items) && items.some(i => i.settingKey === settingKey)
          if (found) setPinned(true)
        } catch {}
      })()
    }
    const onUpdated = () => {
      try {
        const map = readFavoritesCachedMap()
        if (map && Object.prototype.hasOwnProperty.call(map, settingKey)) {
          setPinned(Boolean(map[settingKey]))
        }
      } catch {}
    }
    window.addEventListener('favorites:updated', onUpdated as any)
    return () => { mounted = false; window.removeEventListener('favorites:updated', onUpdated as any) }
  }, [initiallyPinned, settingKey])

  const toggle = async () => {
    if (working) return
    setWorking(true)
    try {
      if (!pinned) {
        const res = await addFavorite({ settingKey, route, label })
        if (res) setPinned(true)
      } else {
        const ok = await removeFavorite(settingKey)
        if (ok) setPinned(false)
      }
      onChange?.(!pinned)
      try { window.dispatchEvent(new Event('favorites:updated')) } catch {}
    } finally {
      setWorking(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label={pinned ? 'Unpin setting' : 'Pin setting'} className="flex items-center gap-1">
      {pinned ? <Star className="h-4 w-4 text-yellow-500" /> : <StarOff className="h-4 w-4 text-gray-400" />}
      {pinned ? 'Pinned' : 'Pin'}
    </Button>
  )
}
