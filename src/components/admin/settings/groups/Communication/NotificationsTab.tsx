'use client'

import React from 'react'
import { SelectField, TextField, Toggle } from '@/components/admin/settings/FormField'
import type { CommunicationNotificationsSettings } from '@/schemas/settings/communication'

interface NotificationsTabProps {
  value: CommunicationNotificationsSettings
  onChange: (next: CommunicationNotificationsSettings) => void
  disabled: boolean
}

const channelOptions = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'deadlines', label: 'Deadlines' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'system', label: 'System alerts' },
]

const digestOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly summary' },
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly summary' },
]

function updatePreference(list: CommunicationNotificationsSettings['preferences'], index: number, patch: Partial<CommunicationNotificationsSettings['preferences'][number]>) {
  return list.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
}

export default function NotificationsTab({ value, onChange, disabled }: NotificationsTabProps) {
  const addPreference = () => {
    onChange({
      ...value,
      preferences: [
        ...value.preferences,
        { channel: 'bookings', email: true, sms: false, inApp: true, push: false, digest: 'immediate' },
      ],
    })
  }

  const removePreference = (index: number) => {
    onChange({ ...value, preferences: value.preferences.filter((_, idx) => idx !== index) })
  }

  const changePreference = (index: number, patch: Partial<CommunicationNotificationsSettings['preferences'][number]>) => {
    onChange({ ...value, preferences: updatePreference(value.preferences, index, patch) })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Digest send time (HH:MM)" value={value.digestTime} onChange={(v) => onChange({ ...value, digestTime: v })} disabled={disabled} />
        <TextField label="Digest timezone" value={value.timezone} onChange={(v) => onChange({ ...value, timezone: v })} disabled={disabled} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Notification preferences</h3>
            <p className="text-xs text-gray-500">Control delivery channels per event type.</p>
          </div>
          <button
            type="button"
            onClick={addPreference}
            disabled={disabled}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Add preference
          </button>
        </div>

        {value.preferences.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">No notification preferences configured.</div>
        ) : (
          <div className="space-y-4">
            {value.preferences.map((preference, index) => (
              <div key={`${preference.channel}-${index}`} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Channel"
                    value={preference.channel}
                    onChange={(v) => changePreference(index, { channel: v as typeof preference.channel })}
                    options={channelOptions}
                    disabled={disabled}
                  />
                  <SelectField
                    label="Digest frequency"
                    value={preference.digest}
                    onChange={(v) => changePreference(index, { digest: v as typeof preference.digest })}
                    options={digestOptions}
                    disabled={disabled}
                  />
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Toggle label="Email" value={preference.email} onChange={(v) => changePreference(index, { email: v })} disabled={disabled} />
                  <Toggle label="SMS" value={preference.sms} onChange={(v) => changePreference(index, { sms: v })} disabled={disabled} />
                  <Toggle label="In-app" value={preference.inApp} onChange={(v) => changePreference(index, { inApp: v })} disabled={disabled} />
                  <Toggle label="Push" value={preference.push} onChange={(v) => changePreference(index, { push: v })} disabled={disabled} />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePreference(index)}
                    disabled={disabled}
                    className="inline-flex items-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
