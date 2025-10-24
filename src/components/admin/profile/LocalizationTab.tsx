'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useTranslations } from '@/lib/i18n'
import { getDefaultTimezone, TimezoneOption } from '@/lib/timezone-helper'
import { COMMON_TIMEZONES, LANGUAGES, VALID_LANGUAGES, isValidTimezone } from './constants'

interface LocalizationData {
  timezone: string
  preferredLanguage: 'en' | 'ar' | 'hi'
}

export default function LocalizationTab({ loading }: { loading: boolean }) {
  const { preferences, loading: preferencesLoading, error: preferencesError, updatePreferences, refetch } = useUserPreferences()
  const { setLocale } = useTranslations()
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<LocalizationData>({
    timezone: getDefaultTimezone(),
    preferredLanguage: 'en',
  })
  const [errors, setErrors] = useState<{ timezone?: string; preferredLanguage?: string }>({})
  const [timezones, setTimezones] = useState<TimezoneOption[]>(COMMON_TIMEZONES.map(tz => ({ code: tz, label: tz, offset: '', abbreviation: '' })))

  // Sync hook data to component state
  useEffect(() => {
    if (preferences) {
      setData({
        timezone: preferences.timezone || 'UTC',
        preferredLanguage: preferences.preferredLanguage || 'en',
      })
      setErrors({})
    }
  }, [preferences])

  useEffect(() => {
    let cancelled = false
    async function loadTimezones(){
      try {
        const r = await fetch('/api/admin/timezones', { cache: 'force-cache' })
        if (!r.ok) throw new Error('failed')
        const d = await r.json()
        const list: TimezoneOption[] = Array.isArray(d?.data) ? d.data : []
        if (!cancelled && list.length) {
          setTimezones(list.map((t: any) => ({
            code: String(t.code),
            label: String(t.label || t.code),
            offset: String(t.offset || ''),
            abbreviation: String(t.abbreviation || 'UTC'),
          })))
        }
      } catch {
        // fallback already set
      }
    }
    loadTimezones()
    return ()=>{ cancelled = true }
  }, [])


  const handleSave = async () => {
    // Client-side validation
    const nextErrors: typeof errors = {}
    if (data.timezone && !isValidTimezone(data.timezone)) nextErrors.timezone = 'Invalid timezone'
    if (!VALID_LANGUAGES.includes(data.preferredLanguage)) nextErrors.preferredLanguage = 'Unsupported language'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      // Ensure payload types: reminderHours not part of this tab, but ensure fields are primitives
      const payload = {
        timezone: String(data.timezone || 'UTC'),
        preferredLanguage: String(data.preferredLanguage || 'en') as 'en' | 'ar' | 'hi',
      }
      await updatePreferences(payload)

      // Update the UI locale immediately to reflect the language change
      setLocale(payload.preferredLanguage as 'en' | 'ar' | 'hi')

      toast.success('Localization settings saved')
      setErrors({})
    } catch (err) {
      console.error('Save error:', err)
      const msg = err instanceof Error ? err.message : 'Failed to save settings'

      // Parse server error messages to show inline field errors
      if (msg.includes('timezone')) {
        setErrors((prev) => ({ ...prev, timezone: msg }))
      } else if (msg.includes('language') || msg.includes('preferredLanguage')) {
        setErrors((prev) => ({ ...prev, preferredLanguage: msg }))
      } else {
        // Generic server error shown as toast
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (preferencesError) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded">
        {preferencesError instanceof Error ? preferencesError.message : 'Failed to load preferences'}
        <button onClick={refetch} className="ml-2 underline hover:no-underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      <div>
        <Label htmlFor="timezone" className="text-sm font-semibold text-gray-900">
          Timezone
        </Label>
        <p className="text-xs text-gray-600 mb-2">Select your timezone for accurate appointment times</p>
        <Select value={data.timezone} onValueChange={(value) => {
          if (isValidTimezone(value)) {
            setData((prev) => ({ ...prev, timezone: value }))
            setErrors((prev) => ({ ...prev, timezone: undefined }))
          } else {
            setErrors((prev) => ({ ...prev, timezone: 'Invalid timezone' }))
          }
        }}>
          <SelectTrigger id="timezone" className={`mt-2 ${errors.timezone ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {timezones.map((tz) => (
              <SelectItem key={tz.code} value={tz.code}>
                <span className="flex items-center gap-2">
                  <span>{tz.label}</span>
                  {tz.offset && <span className="text-xs text-gray-500">({tz.abbreviation})</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && <p className="text-xs text-red-600 mt-1">{errors.timezone}</p>}
      </div>

      <div className="border-t pt-6">
        <Label htmlFor="language" className="text-sm font-semibold text-gray-900">
          Preferred Language
        </Label>
        <p className="text-xs text-gray-600 mb-2">Choose your preferred language for communications</p>
        <Select value={data.preferredLanguage} onValueChange={(value) => {
          setData((prev) => ({ ...prev, preferredLanguage: value as 'en' | 'ar' | 'hi' }))
          setErrors((prev) => ({ ...prev, preferredLanguage: undefined }))
        }}>
          <SelectTrigger id="language" className={`mt-2 ${errors.preferredLanguage ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.preferredLanguage && <p className="text-xs text-red-600 mt-1">{errors.preferredLanguage}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t pt-6">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  )
}
