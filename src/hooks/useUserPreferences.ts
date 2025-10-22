'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import { UserPreferences, PreferencesSchema } from '@/schemas/user-profile'

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
    // Try to parse error body for logging
    const data = await res.json().catch(() => ({}))
    // If server error (500), return safe defaults so UI remains functional
    if (res.status === 500) {
      try {
        console.warn('Preferences fetch failed (500), using defaults', data)
        // PreferencesSchema.parse will apply defaults defined in the schema
        return PreferencesSchema.parse({})
      } catch (schemaErr) {
        console.error('Failed to construct default preferences from schema', schemaErr)
        throw new Error(data.error || `Failed to fetch preferences (${res.status})`)
      }
    }
    // For other client errors, surface the message
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
   * Includes proper rollback and revalidation on error
   */
  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      if (!data) {
        throw new Error('Preferences not loaded yet')
      }

      // Capture previousData to avoid stale closure issues
      const previousData = data
      const optimisticData = { ...previousData, ...newPreferences } as UserPreferences

      // Apply optimistic update immediately (don't revalidate)
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
        // Update with server response (authoritative)
        mutate(updated, false)
        return updated
      } catch (e) {
        // Rollback on error and revalidate from server to ensure UI matches server state
        // mutate(previousData, true) would revalidate in background, but we want immediate UI correction
        await mutate(previousData, true)
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
