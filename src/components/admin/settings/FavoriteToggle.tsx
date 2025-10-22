"use client"

import React, { useEffect, useState } from 'react'
import { Star, StarOff } from 'lucide-react'
import { addFavorite, removeFavorite, getFavorites } from '@/services/favorites.service'
import { Button } from '@/components/ui/button'

interface FavoriteToggleProps {
  settingKey: string
  route: string
  label: string
  initiallyPinned?: boolean
  onChange?: (pinned: boolean) => void
}

export default function FavoriteToggle({
  settingKey,
  route,
  label,
  initiallyPinned = false,
  onChange,
}: FavoriteToggleProps) {
  const [pinned, setPinned] = useState(initiallyPinned)
  const [working, setWorking] = useState(false)
  const [hydrated, setHydrated] = useState(initiallyPinned)

  // Hydrate pinned state from API if not provided initially
  useEffect(() => {
    if (hydrated) return

    let mounted = true
    ;(async () => {
      try {
        const items = await getFavorites()
        if (!mounted) return
        const found = Array.isArray(items) && items.some((i) => i.settingKey === settingKey)
        if (found) setPinned(true)
        setHydrated(true)
      } catch (error) {
        console.error('Failed to hydrate favorite state:', error)
        setHydrated(true) // Mark as hydrated even on error to prevent infinite retries
      }
    })()

    return () => {
      mounted = false
    }
  }, [hydrated, settingKey])

  // Listen for external updates from other FavoriteToggle instances
  useEffect(() => {
    const handleFavoritesUpdated = async () => {
      try {
        const items = await getFavorites()
        const found = Array.isArray(items) && items.some((i) => i.settingKey === settingKey)
        setPinned(found)
      } catch {}
    }

    window.addEventListener('favorites:updated', handleFavoritesUpdated)
    return () => {
      window.removeEventListener('favorites:updated', handleFavoritesUpdated)
    }
  }, [settingKey])

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
      try {
        window.dispatchEvent(new Event('favorites:updated'))
      } catch {}
    } finally {
      setWorking(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={working || !hydrated}
      aria-label={pinned ? 'Unpin setting' : 'Pin setting'}
      className="flex items-center gap-1"
    >
      {pinned ? (
        <Star className="h-4 w-4 text-yellow-500" />
      ) : (
        <StarOff className="h-4 w-4 text-gray-400" />
      )}
      {pinned ? 'Pinned' : 'Pin'}
    </Button>
  )
}
