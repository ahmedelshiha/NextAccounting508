'use client'

import { useEffect, useState, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface BookingNotificationsData {
  bookingEmailConfirm: boolean
  bookingEmailReminder: boolean
  bookingEmailReschedule: boolean
  bookingEmailCancellation: boolean
  bookingSmsReminder: boolean
  bookingSmsConfirmation: boolean
  reminderHours: number[]
}

const REMINDER_HOURS = [24, 12, 6, 2]

export default function BookingNotificationsTab({ loading }: { loading: boolean }) {
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<BookingNotificationsData>({
    bookingEmailConfirm: true,
    bookingEmailReminder: true,
    bookingEmailReschedule: true,
    bookingEmailCancellation: true,
    bookingSmsReminder: false,
    bookingSmsConfirmation: false,
    reminderHours: [24, 2],
  })
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadPreferences = useCallback(async () => {
    try {
      const res = await apiFetch('/api/user/preferences')
      if (res.ok) {
        const json = await res.json()
        setData({
          bookingEmailConfirm: json.bookingEmailConfirm ?? true,
          bookingEmailReminder: json.bookingEmailReminder ?? true,
          bookingEmailReschedule: json.bookingEmailReschedule ?? true,
          bookingEmailCancellation: json.bookingEmailCancellation ?? true,
          bookingSmsReminder: json.bookingSmsReminder ?? false,
          bookingSmsConfirmation: json.bookingSmsConfirmation ?? false,
          reminderHours: Array.isArray(json.reminderHours) ? json.reminderHours : [24, 2],
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
        toast.success('Booking notification preferences saved')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error?.message || 'Failed to save preferences')
      }
    } catch (err) {
      console.error('Save preferences error:', err)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded">
        {loadError}
        <button onClick={loadPreferences} className="ml-2 underline hover:no-underline">
          Retry
        </button>
      </div>
    )
  }

  const toggleReminderHour = (hour: number) => {
    setData((prev) => ({
      ...prev,
      reminderHours: prev.reminderHours.includes(hour)
        ? prev.reminderHours.filter((h) => h !== hour)
        : [...prev.reminderHours, hour].sort((a, b) => b - a),
    }))
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="emailConfirm"
              checked={data.bookingEmailConfirm}
              onCheckedChange={(checked) =>
                setData((prev) => ({ ...prev, bookingEmailConfirm: checked as boolean }))
              }
            />
            <Label htmlFor="emailConfirm" className="text-sm text-gray-700 cursor-pointer">
              Email confirmation when booking is confirmed
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="emailReminder"
              checked={data.bookingEmailReminder}
              onCheckedChange={(checked) =>
                setData((prev) => ({ ...prev, bookingEmailReminder: checked as boolean }))
              }
            />
            <Label htmlFor="emailReminder" className="text-sm text-gray-700 cursor-pointer">
              Email reminder before appointment
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="emailReschedule"
              checked={data.bookingEmailReschedule}
              onCheckedChange={(checked) =>
                setData((prev) => ({ ...prev, bookingEmailReschedule: checked as boolean }))
              }
            />
            <Label htmlFor="emailReschedule" className="text-sm text-gray-700 cursor-pointer">
              Email when appointment is rescheduled
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="emailCancellation"
              checked={data.bookingEmailCancellation}
              onCheckedChange={(checked) =>
                setData((prev) => ({ ...prev, bookingEmailCancellation: checked as boolean }))
              }
            />
            <Label htmlFor="emailCancellation" className="text-sm text-gray-700 cursor-pointer">
              Email when appointment is cancelled
            </Label>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">SMS Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="smsReminder"
              checked={data.bookingSmsReminder}
              onCheckedChange={(checked) =>
                setData((prev) => ({ ...prev, bookingSmsReminder: checked as boolean }))
              }
            />
            <Label htmlFor="smsReminder" className="text-sm text-gray-700 cursor-pointer">
              SMS reminder before appointment
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="smsConfirmation"
              checked={data.bookingSmsConfirmation}
              onCheckedChange={(checked) =>
                setData((prev) => ({ ...prev, bookingSmsConfirmation: checked as boolean }))
              }
            />
            <Label htmlFor="smsConfirmation" className="text-sm text-gray-700 cursor-pointer">
              SMS confirmation when booking is confirmed
            </Label>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Reminder Timing</h3>
        <p className="text-xs text-gray-600 mb-4">
          Select how many hours before your appointment you want to be reminded
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {REMINDER_HOURS.map((hour) => (
            <div key={hour} className="flex items-center gap-2">
              <Checkbox
                id={`reminder-${hour}`}
                checked={data.reminderHours.includes(hour)}
                onCheckedChange={() => toggleReminderHour(hour)}
              />
              <Label htmlFor={`reminder-${hour}`} className="text-sm text-gray-700 cursor-pointer">
                {hour}h before
              </Label>
            </div>
          ))}
        </div>
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
