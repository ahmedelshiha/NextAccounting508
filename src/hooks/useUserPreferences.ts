'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import { UserPreferences } from '@/schemas/user-profile'

/**
 * Custom hook for fetching and caching user preferences
 * Uses SWR for automatic caching and deduplication of requests
 *
 * Benefits:
 * - Single request when mounted by multiple components
 * - Automatic revalidation on focus
 * - Easy error handling and loading states
 * - Cache-aware, prevents duplicate API calls
 */

interface UseUserPreferencesOptions {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  dedupingInterval?: number
  focusThrottleInterval?: number
}

const defaultOptions: UseUserPreferencesOptions = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 60_000, // 1 minute
  focusThrottleInterval: 300_000, // 5 minutes
}

async function fetchPreferences(): Promise<UserPreferences> {
  const res = await apiFetch('/api/user/preferences')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Failed to fetch preferences (${res.status})`)
  }
  return res.json()
}

export function useUserPreferences(options: UseUserPreferencesOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options }

  const { data, error, isLoading, isValidating, mutate } = useSWR<UserPreferences>(
    '/api/user/preferences',
    fetchPreferences,
    {
      revalidateOnFocus: mergedOptions.revalidateOnFocus,
      revalidateOnReconnect: mergedOptions.revalidateOnReconnect,
      dedupingInterval: 300_000,
      focusThrottleInterval: mergedOptions.focusThrottleInterval,
    }
  )

  /**
   * Update preferences with optimistic update support
   */
  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      // Optimistic update
      const previousData = data
      const optimisticData = { ...data, ...newPreferences } as UserPreferences

      mutate(optimisticData, false)

      try {
        const res = await apiFetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPreferences),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to update preferences (${res.status})`)
        }

        const updated = await res.json()
        mutate(updated, false)
        return updated
      } catch (e) {
        // Rollback on error
        mutate(previousData, false)
        throw e
      }
    },
    [data, mutate]
  )

  /**
   * Refetch preferences from server
   */
  const refetch = useCallback(async () => {
    await mutate()
  }, [mutate])

  return {
    preferences: data,
    loading: isLoading,
    validating: isValidating,
    error,
    updatePreferences,
    refetch,
    mutate,
  }
}
