'use client'

import React from 'react'
import { SelectField, TextField, Toggle } from '@/components/admin/settings/FormField'
import type { CommunicationSmsSettings } from '@/schemas/settings/communication'

interface SmsTabProps {
  value: CommunicationSmsSettings
  onChange: (next: CommunicationSmsSettings) => void
  disabled: boolean
}

const providerOptions = [
  { value: 'none', label: 'None' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'plivo', label: 'Plivo' },
  { value: 'nexmo', label: 'Vonage' },
  { value: 'messageBird', label: 'MessageBird' },
]

function updateRoute(list: CommunicationSmsSettings['routes'], index: number, patch: Partial<CommunicationSmsSettings['routes'][number]>) {
  return list.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
}

export default function SMSTab({ value, onChange, disabled }: SmsTabProps) {
  const updateField = <K extends keyof CommunicationSmsSettings>(key: K, nextValue: CommunicationSmsSettings[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  const addRoute = () => {
    onChange({ ...value, routes: [...value.routes, { key: `route_${value.routes.length + 1}`, destination: '' }] })
  }

  const removeRoute = (index: number) => {
    onChange({ ...value, routes: value.routes.filter((_, idx) => idx !== index) })
  }

  const changeRoute = (index: number, patch: Partial<CommunicationSmsSettings['routes'][number]>) => {
    onChange({ ...value, routes: updateRoute(value.routes, index, patch) })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="SMS provider" value={value.provider} onChange={(v) => updateField('provider', v as CommunicationSmsSettings['provider'])} options={providerOptions} disabled={disabled} />
        <TextField label="Sender ID / From number" value={value.senderId} onChange={(v) => updateField('senderId', v)} disabled={disabled} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Toggle label="Transactional SMS enabled" value={value.transactionalEnabled} onChange={(v) => updateField('transactionalEnabled', v)} disabled={disabled} />
        <Toggle label="Marketing SMS enabled" value={value.marketingEnabled} onChange={(v) => updateField('marketingEnabled', v)} disabled={disabled} />
        <Toggle label="Fallback to email" value={value.fallbackToEmail} onChange={(v) => updateField('fallbackToEmail', v)} disabled={disabled} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Routing rules</h3>
            <p className="text-xs text-gray-500">Override destinations for specific segments or regions.</p>
          </div>
          <button
            type="button"
            onClick={addRoute}
            disabled={disabled}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Add route
          </button>
        </div>

        {value.routes.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">No custom routes configured.</div>
        ) : (
          <div className="space-y-4">
            {value.routes.map((route, index) => (
              <div key={route.key || index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Route key" value={route.key} onChange={(v) => changeRoute(index, { key: v })} disabled={disabled} />
                  <TextField label="Destination number or segment" value={route.destination} onChange={(v) => changeRoute(index, { destination: v })} disabled={disabled} />
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => removeRoute(index)}
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
