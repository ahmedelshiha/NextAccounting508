"use client"

import { useCallback } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'

export function useTranslationStatus() {
  const { setLoading, setTranslationStatus, setError } = useLocalizationContext()

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)
      const r = await fetch('/api/admin/translations/status')
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load translation status')
      setTranslationStatus(d.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load translation status')
      throw e
    } finally {
      setLoading(false)
    }
  }, [setLoading, setTranslationStatus, setError])

  return { loadStatus }
}
