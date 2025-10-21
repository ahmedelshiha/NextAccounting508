'use client'

import { useEffect, useState, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface LocalizationData {
  timezone: string
  preferredLanguage: string
}

const TIMEZONES = [
  'UTC',
  'US/Eastern',
  'US/Central',
  'US/Mountain',
  'US/Pacific',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
]

export default function LocalizationTab({ loading }: { loading: boolean }) {
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<LocalizationData>({
    timezone: 'UTC',
    preferredLanguage: 'en',
  })

  const loadPreferences = useCallback(async () => {
    try {
      const res = await apiFetch('/api/user/preferences')
      if (res.ok) {
        const json = await res.json()
        setData({
          timezone: json.timezone || 'UTC',
          preferredLanguage: json.preferredLanguage || 'en',
        })
        setLoadError(null)
      } else {
        setLoadError('Failed to load preferences')
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
      setLoadError('Failed to load preferences')
    }
  }, [])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])


  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success('Localization settings saved')
        setLoadError(null)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error?.message || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
        <Select value={data.timezone} onValueChange={(value) => setData((prev) => ({ ...prev, timezone: value }))}>
          <SelectTrigger id="timezone" className="mt-2">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
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
        <Select value={data.preferredLanguage} onValueChange={(value) => setData((prev) => ({ ...prev, preferredLanguage: value }))}>
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
