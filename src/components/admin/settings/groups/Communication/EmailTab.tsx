'use client'

import React from 'react'
import { TextField, Toggle } from '@/components/admin/settings/FormField'
import type { CommunicationEmailSettings } from '@/schemas/settings/communication'

interface EmailTabProps {
  value: CommunicationEmailSettings
  onChange: (next: CommunicationEmailSettings) => void
  disabled: boolean
}

function updateTemplates(list: CommunicationEmailSettings['templates'], index: number, patch: Partial<CommunicationEmailSettings['templates'][number]>) {
  return list.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
}

function removeTemplate(list: CommunicationEmailSettings['templates'], index: number) {
  return list.filter((_, idx) => idx !== index)
}

export default function EmailTab({ value, onChange, disabled }: EmailTabProps) {
  const handleFieldChange = <K extends keyof CommunicationEmailSettings>(key: K, nextValue: CommunicationEmailSettings[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  const addTemplate = () => {
    const next = [...value.templates, { key: `template_${value.templates.length + 1}`, name: 'New Template', subject: '', body: '', enabled: true }]
    onChange({ ...value, templates: next })
  }

  const onTemplateChange = (index: number, patch: Partial<CommunicationEmailSettings['templates'][number]>) => {
    onChange({ ...value, templates: updateTemplates(value.templates, index, patch) })
  }

  const onTemplateRemove = (index: number) => {
    onChange({ ...value, templates: removeTemplate(value.templates, index) })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Sender name" value={value.senderName} onChange={(v) => handleFieldChange('senderName', v)} disabled={disabled} />
        <TextField label="Sender email" value={value.senderEmail} onChange={(v) => handleFieldChange('senderEmail', v)} disabled={disabled} />
        <TextField label="Reply-to email" value={value.replyTo} onChange={(v) => handleFieldChange('replyTo', v)} disabled={disabled} />
      </div>

      <div>
        <label htmlFor="email-signature" className="block text-sm font-medium text-gray-700 mb-1">Email signature</label>
        <textarea
          id="email-signature"
          value={value.signatureHtml}
          onChange={(event) => handleFieldChange('signatureHtml', event.target.value)}
          className="w-full min-h-[140px] rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-gray-500">Supports HTML for branding and compliance banners.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Toggle label="Transactional emails enabled" value={value.transactionalEnabled} onChange={(v) => handleFieldChange('transactionalEnabled', v)} disabled={disabled} />
        <Toggle label="Marketing emails enabled" value={value.marketingEnabled} onChange={(v) => handleFieldChange('marketingEnabled', v)} disabled={disabled} />
        <Toggle label="BCC compliance mailbox" value={value.complianceBcc} onChange={(v) => handleFieldChange('complianceBcc', v)} disabled={disabled} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Email templates</h3>
            <p className="text-xs text-gray-500">Manage transactional and marketing templates referenced across automations.</p>
          </div>
          <button
            type="button"
            onClick={addTemplate}
            disabled={disabled}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Add template
          </button>
        </div>

        {value.templates.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">No templates configured.</div>
        ) : (
          <div className="space-y-4">
            {value.templates.map((template, index) => (
              <div key={template.key || index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField label="Template key" value={template.key} onChange={(v) => onTemplateChange(index, { key: v })} disabled={disabled} />
                  <TextField label="Display name" value={template.name} onChange={(v) => onTemplateChange(index, { name: v })} disabled={disabled} />
                  <TextField label="Subject" value={template.subject} onChange={(v) => onTemplateChange(index, { subject: v })} disabled={disabled} />
                </div>

                <div className="mt-3">
                  <label htmlFor={`template-body-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Body</label>
                  <textarea
                    id={`template-body-${index}`}
                    value={template.body}
                    onChange={(event) => onTemplateChange(index, { body: event.target.value })}
                    className="w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={disabled}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Toggle label="Template active" value={template.enabled} onChange={(v) => onTemplateChange(index, { enabled: v })} disabled={disabled} />
                  <button
                    type="button"
                    onClick={() => onTemplateRemove(index)}
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
