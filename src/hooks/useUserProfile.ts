"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

export interface UserProfile {
  id?: string
  name?: string | null
  email?: string | null
  organization?: string | null
  image?: string | null
  role?: string | null
  [key: string]: any
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/users/me')
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`)
      const data = await res.json()
      const next = (data && typeof data === 'object' && 'user' in data) ? (data as any).user : data
      setProfile(next)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (patch: Partial<UserProfile>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      if (!res.ok) throw new Error(`Failed to update profile (${res.status})`)
      const data = await res.json()
      const next = (data && typeof data === 'object' && 'user' in data) ? (data as any).user : data
      setProfile(next)
      try { const { announce } = await import('@/lib/a11y'); announce('Profile updated') } catch {}
      try { toast.success('Profile updated') } catch {}
      return next
    } catch (e: any) {
      setError(String(e?.message || e))
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  return { profile, loading, error, refresh, update }
}
