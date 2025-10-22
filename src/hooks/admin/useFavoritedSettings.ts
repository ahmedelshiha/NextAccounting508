'use client'

import { useEffect, useState } from 'react'
import { getFavorites } from '@/services/favorites.service'
import type { FavoriteSettingItem } from '@/services/favorites.service'

/**
 * Hook to load and cache the user's favorited settings
 * Provides efficient hydration for multiple FavoriteToggle components
 */
export function useFavoritedSettings() {
  const [favorites, setFavorites] = useState<FavoriteSettingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const items = await getFavorites()
        if (mounted) {
          setFavorites(items)
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  /**
   * Check if a specific setting is favorited
   */
  const isFavorited = (settingKey: string): boolean => {
    return favorites.some(fav => fav.settingKey === settingKey)
  }

  /**
   * Listen for external favorites updates (from other FavoriteToggle instances)
   */
  useEffect(() => {
    const handleFavoritesUpdated = async () => {
      try {
        const items = await getFavorites()
        setFavorites(items)
      } catch (error) {
        console.error('Failed to refresh favorites:', error)
      }
    }

    window.addEventListener('favorites:updated', handleFavoritesUpdated)
    return () => {
      window.removeEventListener('favorites:updated', handleFavoritesUpdated)
    }
  }, [])

  return {
    favorites,
    loading,
    isFavorited,
  }
}
