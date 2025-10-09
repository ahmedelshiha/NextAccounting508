'use client'

import React from 'react'
import { TextField, Toggle } from '@/components/admin/settings/FormField'
import type { CommunicationNewslettersSettings } from '@/schemas/settings/communication'

interface NewslettersTabProps {
  value: CommunicationNewslettersSettings
  onChange: (next: CommunicationNewslettersSettings) => void
  disabled: boolean
}

export default function NewslettersTab({ value, onChange, disabled }: NewslettersTabProps) {
  const updateField = <K extends keyof CommunicationNewslettersSettings>(key: K, nextValue: CommunicationNewslettersSettings[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  const addTopic = () => {
    onChange({
      ...value,
      topics: [...value.topics, { key: `topic_${value.topics.length + 1}`, label: 'New topic', description: '' }],
    })
  }

  const updateTopic = (index: number, patch: Partial<CommunicationNewslettersSettings['topics'][number]>) => {
    onChange({
      ...value,
      topics: value.topics.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    })
  }

  const removeTopic = (index: number) => {
    onChange({ ...value, topics: value.topics.filter((_, idx) => idx !== index) })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Toggle label="Newsletters enabled" value={value.enabled} onChange={(v) => updateField('enabled', v)} disabled={disabled} />
        <Toggle label="Require double opt-in" value={value.doubleOptIn} onChange={(v) => updateField('doubleOptIn', v)} disabled={disabled} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Default sender name" value={value.defaultSenderName} onChange={(v) => updateField('defaultSenderName', v)} disabled={disabled} />
        <TextField label="Default sender email" value={value.defaultSenderEmail} onChange={(v) => updateField('defaultSenderEmail', v)} disabled={disabled} />
      </div>

      <TextField label="Archive URL" value={value.archiveUrl} onChange={(v) => updateField('archiveUrl', v)} disabled={disabled} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Topics</h3>
            <p className="text-xs text-gray-500">Segment newsletter preferences by topic.</p>
          </div>
          <button
            type="button"
            onClick={addTopic}
            disabled={disabled}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Add topic
          </button>
        </div>

        {value.topics.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">No topics configured.</div>
        ) : (
          <div className="space-y-4">
            {value.topics.map((topic, index) => (
              <div key={topic.key || index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Topic key" value={topic.key} onChange={(v) => updateTopic(index, { key: v })} disabled={disabled} />
                  <TextField label="Label" value={topic.label} onChange={(v) => updateTopic(index, { label: v })} disabled={disabled} />
                </div>
                <div className="mt-3">
                  <label htmlFor={`topic-description-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    id={`topic-description-${index}`}
                    value={topic.description ?? ''}
                    onChange={(event) => updateTopic(index, { description: event.target.value })}
                    className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={disabled}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
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
