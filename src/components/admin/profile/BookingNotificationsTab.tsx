'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUserPreferences } from '@/hooks/useUserPreferences'

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
  const { preferences, loading: preferencesLoading, error: preferencesError, updatePreferences, refetch } = useUserPreferences()
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

  // Sync hook data to component state
  useEffect(() => {
    if (preferences) {
      setData({
        bookingEmailConfirm: preferences.bookingEmailConfirm ?? true,
        bookingEmailReminder: preferences.bookingEmailReminder ?? true,
        bookingEmailReschedule: preferences.bookingEmailReschedule ?? true,
        bookingEmailCancellation: preferences.bookingEmailCancellation ?? true,
        bookingSmsReminder: preferences.bookingSmsReminder ?? false,
        bookingSmsConfirmation: preferences.bookingSmsConfirmation ?? false,
        reminderHours: Array.isArray(preferences.reminderHours) ? preferences.reminderHours : [24, 2],
      })
    }
  }, [preferences])


  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePreferences(data)
      toast.success('Booking notification preferences saved')
    } catch (err) {
      console.error('Save preferences error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
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
