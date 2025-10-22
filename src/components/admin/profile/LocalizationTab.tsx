'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { COMMON_TIMEZONES, LANGUAGES, VALID_LANGUAGES, isValidTimezone } from './constants'

interface LocalizationData {
  timezone: string
  preferredLanguage: 'en' | 'ar' | 'hi'
}

export default function LocalizationTab({ loading }: { loading: boolean }) {
  const { preferences, loading: preferencesLoading, error: preferencesError, updatePreferences, refetch } = useUserPreferences()
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<LocalizationData>({
    timezone: 'UTC',
    preferredLanguage: 'en',
  })
  const [errors, setErrors] = useState<{ timezone?: string; preferredLanguage?: string }>({})

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


  const handleSave = async () => {
    // Client-side validation
    const nextErrors: typeof errors = {}
    if (data.timezone && !isValidTimezone(data.timezone)) nextErrors.timezone = 'Invalid timezone'
    if (!VALID_LANGUAGES.includes(data.preferredLanguage)) nextErrors.preferredLanguage = 'Unsupported language'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast.error('Please fix validation errors before saving')
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
      toast.success('Localization settings saved')
      setErrors({})
    } catch (err) {
      console.error('Save error:', err)
      const msg = err instanceof Error ? err.message : 'Failed to save settings'
      toast.error(msg)
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
          } else {
            toast.error('Invalid timezone')
          }
        }}>
          <SelectTrigger id="timezone" className="mt-2">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-6">
        <Label htmlFor="language" className="text-sm font-semibold text-gray-900">
          Preferred Language
        </Label>
        <p className="text-xs text-gray-600 mb-2">Choose your preferred language for communications</p>
        <Select value={data.preferredLanguage} onValueChange={(value) => setData((prev) => ({ ...prev, preferredLanguage: value as 'en' | 'ar' | 'hi' }))}>
          <SelectTrigger id="language" className="mt-2">
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
