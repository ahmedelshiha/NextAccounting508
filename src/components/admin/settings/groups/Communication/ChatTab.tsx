'use client'

import React from 'react'
import { SelectField, TextField, Toggle } from '@/components/admin/settings/FormField'
import type { CommunicationChatSettings } from '@/schemas/settings/communication'

interface ChatTabProps {
  value: CommunicationChatSettings
  onChange: (next: CommunicationChatSettings) => void
  disabled: boolean
}

const providerOptions = [
  { value: 'none', label: 'Disabled' },
  { value: 'intercom', label: 'Intercom' },
  { value: 'drift', label: 'Drift' },
  { value: 'zendesk', label: 'Zendesk' },
  { value: 'liveChat', label: 'LiveChat' },
]

const routingOptions = [
  { value: 'roundRobin', label: 'Round robin' },
  { value: 'leastBusy', label: 'Least busy' },
  { value: 'firstAvailable', label: 'First available' },
  { value: 'manual', label: 'Manual assignment' },
]

export default function ChatTab({ value, onChange, disabled }: ChatTabProps) {
  const updateField = <K extends keyof CommunicationChatSettings>(key: K, nextValue: CommunicationChatSettings[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  const updateWorkingHours = <K extends keyof CommunicationChatSettings['workingHours']>(key: K, nextValue: CommunicationChatSettings['workingHours'][K]) => {
    onChange({ ...value, workingHours: { ...value.workingHours, [key]: nextValue } })
  }

  const addEscalationEmail = () => {
    onChange({ ...value, escalationEmails: [...value.escalationEmails, ''] })
  }

  const updateEscalationEmail = (index: number, email: string) => {
    onChange({ ...value, escalationEmails: value.escalationEmails.map((item, idx) => (idx === index ? email : item)) })
  }

  const removeEscalationEmail = (index: number) => {
    onChange({ ...value, escalationEmails: value.escalationEmails.filter((_, idx) => idx !== index) })
  }

  return (
    <div className="space-y-6">
      <Toggle label="Live chat enabled" value={value.enabled} onChange={(v) => updateField('enabled', v)} disabled={disabled} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Provider" value={value.provider} onChange={(v) => updateField('provider', v as CommunicationChatSettings['provider'])} options={providerOptions} disabled={disabled} />
        <SelectField label="Routing" value={value.routing} onChange={(v) => updateField('routing', v as CommunicationChatSettings['routing'])} options={routingOptions} disabled={disabled} />
      </div>

      <div>
        <label htmlFor="chat-offline-message" className="block text-sm font-medium text-gray-700 mb-1">Offline message</label>
        <textarea
          id="chat-offline-message"
          value={value.offlineMessage}
          onChange={(event) => updateField('offlineMessage', event.target.value)}
          className="w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-gray-500">Displayed when no agents are available.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextField label="Timezone" value={value.workingHours.timezone} onChange={(v) => updateWorkingHours('timezone', v)} disabled={disabled} />
        <TextField label="Start time (HH:MM)" value={value.workingHours.start} onChange={(v) => updateWorkingHours('start', v)} disabled={disabled} />
        <TextField label="End time (HH:MM)" value={value.workingHours.end} onChange={(v) => updateWorkingHours('end', v)} disabled={disabled} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Escalation emails</h3>
            <p className="text-xs text-gray-500">Receives alerts when conversations remain unanswered.</p>
          </div>
          <button
            type="button"
            onClick={addEscalationEmail}
            disabled={disabled}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Add email
          </button>
        </div>

        {value.escalationEmails.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">No escalation recipients configured.</div>
        ) : (
          <div className="space-y-3">
            {value.escalationEmails.map((email, index) => (
              <div key={`${email}-${index}`} className="flex items-center gap-3">
                <TextField label={`Recipient ${index + 1}`} value={email} onChange={(v) => updateEscalationEmail(index, v)} disabled={disabled} />
                <button
                  type="button"
                  onClick={() => removeEscalationEmail(index)}
                  disabled={disabled}
                  className="inline-flex items-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 self-end"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
